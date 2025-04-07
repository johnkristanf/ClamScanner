import tensorflow as tf
import keras._tf_keras.keras.layers as layers
from keras._tf_keras.keras import regularizers
from keras import Sequential
from keras._tf_keras.keras.applications import MobileNetV3Large
from keras._tf_keras.keras.applications.resnet import preprocess_input
from keras._tf_keras.keras.optimizers import Adam
import numpy as np
import os
import json
import asyncio
from PIL import Image
from ws_client import clients
import train.evaluate as eval
import train.callbacks as cb
from database.train_db_operations import TrainDatabaseOperations
from keras._tf_keras.keras import mixed_precision


mixed_precision.set_global_policy('mixed_float16')  # Enable mixed precision

# Constants
DATASET_DIR = "./datasets"  # Path to dataset directory
BATCH_SIZE = 4
IMAGE_SIZE = (224, 224)

train_db = TrainDatabaseOperations()


def load_dataset():
    """
    Loads the dataset from the local file system.
    The folder structure should be: 
        datasets/
            class_1/
                img1.jpg
                img2.jpg
            class_2/
                img3.jpg
                img4.jpg
    """

    dataset = tf.keras.preprocessing.image_dataset_from_directory(
        DATASET_DIR,
        image_size=IMAGE_SIZE,
        batch_size=None,
        label_mode='int'  # Uses integer labels from folder names
    )

    class_names = dataset.class_names  # Extracts class names from folder names
    num_classes = len(class_names)

    # Splitting dataset: 70% Train, 15% Validation, 15% Test
    dataset_size = len(dataset)
    train_size = int(0.7 * dataset_size)
    val_size = test_size = (dataset_size - train_size) // 2

    train_ds = dataset.take(train_size)
    remaining_ds = dataset.skip(train_size)
    val_ds = remaining_ds.take(val_size)
    test_ds = remaining_ds.skip(val_size)

    print(f"Training dataset size: {len(list(train_ds))} batches")
    print(f"Validation dataset size: {len(list(val_ds))} batches")
    print(f"Test dataset size: {len(list(test_ds))} batches")
    print(f"Class Names: {class_names}")

    return train_ds, val_ds, test_ds, num_classes, class_names


def prepare(ds, shuffle=False, augment=False):
    """
    Prepares the dataset for training by applying preprocessing and augmentation.
    """
    if augment:
        data_augmentation = Sequential([
            layers.RandomFlip('horizontal'),
            layers.RandomRotation(0.3),
            layers.GaussianNoise(0.3),
            # layers.RandomContrast(0.3),
            # layers.RandomBrightness(0.3),
            # layers.RandomHeight(0.3),
            # layers.RandomWidth(0.3),
            # layers.RandomZoom(0.3), 
            # layers.RandomTranslation(height_factor=0.2, width_factor=0.2),  
        ])

        ds = ds.map(lambda x, y: (data_augmentation(x), y), num_parallel_calls=tf.data.AUTOTUNE)

    # Ensure correct preprocessing for MobileNetV3
    ds = ds.map(lambda x, y: (tf.image.resize(x, IMAGE_SIZE), y), num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.map(lambda x, y: (preprocess_input(x), y), num_parallel_calls=tf.data.AUTOTUNE)


    if shuffle:
        ds = ds.shuffle(buffer_size=100)

    ds = ds.batch(BATCH_SIZE).cache().prefetch(tf.data.AUTOTUNE)  # Optimized

    return ds


class CustomCallback(tf.keras.callbacks.Callback):
    def __init__(self, class_names):
        super().__init__()
        self.class_names = class_names

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


def train_save_model(train_ds, validation_ds, num_classes, class_names, model_version):
    """
    Builds, trains, and saves a ResNet50 model.
    """

    base_model = MobileNetV3Large(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3),
    )

    for layer in base_model.layers[-20:]:  # Unfreezing the last 20 layers
        layer.trainable = True


    model = Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(512, activation='relu'),  
        layers.Dropout(0.4),
        layers.Dense(num_classes, activation='softmax')
    ])



    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    early_stopping, lr_scheduler, model_checkpoint = cb.training_callbacks(model_version=model_version)
    custom_callback = CustomCallback(class_names)

    fine_tune_history = model.fit(
        train_ds,
        epochs=10,
        validation_data=validation_ds,
        callbacks=[early_stopping, lr_scheduler, model_checkpoint, custom_callback]
    )

    model.save(f'./models/ClamScanner_v{model_version}.keras')

    return fine_tune_history


def train_new_model(model_version):
    """
    Loads dataset, trains model, and saves training metrics.
    """

    train_ds, val_ds, test_ds, num_classes, class_names = load_dataset()

    train_ds = prepare(train_ds, shuffle=True, augment=True)
    val_ds = prepare(val_ds)
    test_ds = prepare(test_ds)

    fine_tune_history = train_save_model(train_ds, val_ds, num_classes, class_names, model_version)

    train_acc = fine_tune_history.history['accuracy']
    val_acc = fine_tune_history.history['val_accuracy']
    train_loss = fine_tune_history.history['loss']
    val_loss = fine_tune_history.history['val_loss']

    data = {
        'version': model_version,
        'train_acc': train_acc[-1],
        'val_acc': val_acc[-1],
        'train_loss': train_loss[-1],
        'val_loss': val_loss[-1],
    }

    train_db.insert_train_metrics(data)
