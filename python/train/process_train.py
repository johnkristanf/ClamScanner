import tensorflow as tf
import keras._tf_keras.keras.layers as layers

from keras._tf_keras.keras import regularizers

from keras import Sequential
from keras._tf_keras.keras.utils import image_dataset_from_directory

from keras._tf_keras.keras.applications import ResNet50
from keras._tf_keras.keras.applications.resnet import preprocess_input

from keras._tf_keras.keras.optimizers import Adam
from keras import mixed_precision

# import tensorflow as tf
# from tensorflow.keras import layers, regularizers, Sequential
# from tensorflow.keras.preprocessing import image_dataset_from_directory
# from tensorflow.keras.applications import ResNet50
# from tensorflow.keras.applications.resnet import preprocess_input
# from tensorflow.keras.optimizers import Adam
# from tensorflow.keras.models import load_mode

import json

import asyncio
import threading

import train.evaluate as eval
import train.callbacks as cb
from database.train_db_operations import TrainDatabaseOperations

from ws_client import clients

import os
import boto3
import numpy as np

from dotenv import load_dotenv


from io import BytesIO
from PIL import Image


mixed_precision.set_global_policy('mixed_float16')
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

BUCKET_NAME = 'clamscanner-bucket'
DATASET_PREFIX = 'datasets/'
train = TrainDatabaseOperations()


def fetch_class_name_from_s3():
    response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=DATASET_PREFIX, Delimiter='/')
    class_names = []

    for content in response['CommonPrefixes']:
        folder_name = content['Prefix'].replace(DATASET_PREFIX, '').strip('/')
        if folder_name:
            class_names.append(folder_name)

    return class_names


def fetch_s3_image_keys(dataset_class):
    response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f"datasets/{dataset_class}/")

    if 'Contents' not in response:
        return []

    image_keys = [ obj['Key'] for obj in response['Contents'] if obj['Key'].lower().endswith(('jpg', 'jpeg', 'png')) ]
    return image_keys


def load_dataset_s3():
    class_names = fetch_class_name_from_s3()
    class_to_idx = {class_name: idx for idx, class_name in enumerate(class_names)}


    def image_generator():
        for class_name in class_names:
            image_keys = fetch_s3_image_keys(class_name)
            for key in image_keys:
                response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
                image_data = response['Body'].read()
                img = Image.open(BytesIO(image_data)).convert('RGB')
                img = img.resize((224, 224))
                img = np.array(img, dtype=np.float32)
                img = preprocess_input(img)
                yield img, class_to_idx[class_name]

    dataset = tf.data.Dataset.from_generator(
        image_generator,
        output_signature=(tf.TensorSpec(shape=(224, 224, 3), dtype=tf.float32),
                          tf.TensorSpec(shape=(), dtype=tf.int32))
    )

    dataset = dataset.batch(8).prefetch(tf.data.AUTOTUNE)  
    return dataset, len(class_names), class_names






def load_dataset() -> tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, int, list[str]]:

    dataset, num_classes, class_names = load_dataset_s3()

    dataset_size = tf.data.experimental.cardinality(dataset).numpy()  
    train_size = int(0.7 * dataset_size)
    val_size = test_size = (dataset_size - train_size) 


    train_ds = dataset.take(train_size)
    remaining_ds = dataset.skip(train_size)
    val_ds = remaining_ds.take(val_size)
    test_ds = remaining_ds.skip(val_size)

    train_ds_size = len(list(train_ds))
    val_ds_size = len(list(val_ds))
    test_ds_size = len(list(test_ds))

    print(f"Training dataset size: {train_ds_size} batches")
    print(f"Validation dataset size: {val_ds_size} batches")
    print(f"Test dataset size: {test_ds_size} batches")
    print(f"Class Name: {class_names}")

    return train_ds, val_ds, test_ds, num_classes, class_names



def prepare(ds: tf.data.Dataset, shuffle=False, augment=False):

    if augment:
        data_augmentation = Sequential([
            layers.RandomFlip('horizontal'),
            layers.RandomRotation(0.2),
            layers.RandomContrast(0.2),
            # layers.RandomBrightness(0.2),
            # layers.GaussianNoise(0.2),
            # layers.RandomHeight(0.2),
            # layers.RandomWidth(0.2),
        ])

        ds = ds.map(lambda x, y: (data_augmentation(x), y), num_parallel_calls=tf.data.AUTOTUNE)

    ds = ds.map(lambda x, y: (preprocess_input(x), y), num_parallel_calls=tf.data.AUTOTUNE)

    if shuffle:
        dataset_size = tf.data.experimental.cardinality(ds).numpy()
        if dataset_size > 0:
            buffer_size = dataset_size
            ds = ds.shuffle(buffer_size=buffer_size)
        else:
            ds = ds.shuffle(buffer_size=100)

    return ds.prefetch(buffer_size=tf.data.AUTOTUNE)



class CustomCallback(tf.keras.callbacks.Callback):
    def __init__(self, class_names):
        super().__init__()
        self.class_names = class_names

    # ASK GPT IF GETTING VAL ACC AND VAL LOSS CAN MAKE THE TRAINING SLOWER
    async def send_training_update(self, epoch, logs):
        data = {
            'epoch': epoch,
            'accuracy': logs.get('accuracy'),
            'val_accuracy': logs.get('val_accuracy'),
            'loss': logs.get('loss'),
            'val_loss': logs.get('val_loss'),
        }
        message = json.dumps(data)
        tasks = [client.send_text(message) for client in clients]
        await asyncio.gather(*tasks)

    def on_epoch_end(self, epoch, logs=None):
        asyncio.run(self.send_training_update(epoch, logs))

    def on_train_end(self, logs=None):
        async def send_train_completion_message():
            completion_message = json.dumps({'completion_message': 'Training Completed!'})
            tasks = [client.send_text(completion_message) for client in clients]
            await asyncio.gather(*tasks)

        asyncio.run(send_train_completion_message())




def train_save_model(train_ds, validation_ds, num_classes: int, class_names: list[str], model_version: str):

    base_model = ResNet50(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3),
        pooling='avg'
    )

    # Freeze all but last 50 layers 
    # - which means kuha rakag 50 layers knowledge 
    #   from resnet then adapt mostly saimong dataset

    for layer in base_model.layers[:-50]:
        layer.trainable = False


    model = Sequential([
        base_model,
        layers.Dense(1024, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])


    model.summary()

    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )


    # for layer in base_model.layers[100:]:
    #     layer.trainable = True


    # model.compile(
    #     optimizer=Adam(learning_rate=1e-5),
    #     loss='sparse_categorical_crossentropy',
    #     metrics=['accuracy']
    # )


    early_stopping, lr_scheduler, model_checkpoint = cb.training_callbacks(model_version=model_version)
    custom_callback = CustomCallback(class_names)

    fine_tune_history = model.fit(
        train_ds,
        epochs=10,
        validation_data=validation_ds,
        callbacks=[early_stopping, lr_scheduler, model_checkpoint, custom_callback]
    )

    model.summary()

    model.save(f'./models/ClamScanner_v{model_version}.keras')

    return fine_tune_history




def train_new_model(model_version):
    train_ds, val_ds, test_ds, num_classes, class_names = load_dataset()

    train_ds = prepare(train_ds, shuffle=True, augment=True)
    val_ds =   prepare(val_ds)
    test_ds =  prepare(test_ds)

    fine_tune_history = train_save_model(train_ds, val_ds, num_classes, class_names, model_version)

    # eval.plot_accuracy_loss(fine_tune_history)
    # recall, f1_score, precision_class = eval.evaluate_model(test_ds, model_version)

    
    train_acc = fine_tune_history.history['accuracy']
    val_acc = fine_tune_history.history['val_accuracy']
    train_loss = fine_tune_history.history['loss']
    val_loss = fine_tune_history.history['val_loss']

    data = {
        'version':      model_version,
        'train_acc':        train_acc[-1],
        'val_acc':          val_acc[-1],
        'train_loss':       train_loss[-1],
        'val_loss':         val_loss[-1],
    }

    train.insert_train_metrics(data)

    return None