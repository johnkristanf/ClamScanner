import tensorflow as tf
import keras._tf_keras.keras.layers as layers

from keras._tf_keras.keras import regularizers

from keras import Sequential
from keras._tf_keras.keras.utils import image_dataset_from_directory

from keras._tf_keras.keras.applications import ResNet50
from keras._tf_keras.keras.applications.resnet import preprocess_input

from keras._tf_keras.keras.optimizers import Adam

import json

import asyncio

import train.evaluate as eval
import train.callbacks as cb

from ws_client import clients


def load_dataset(DATASET_FOLDER: str) -> tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, int, list[str]]:
    image_size = (224, 224)
    batch_size = 32

    dataset = image_dataset_from_directory(
        DATASET_FOLDER,
        image_size=image_size,
        batch_size=batch_size,
        seed=123,
        label_mode='int',
    ) 

    dataset_size = len(dataset)
    train_size = int(0.7 * dataset_size)
    val_test_size = (dataset_size - train_size) // 2
    val_size = test_size = val_test_size

    train_ds = dataset.take(train_size)
    remaining_ds = dataset.skip(train_size)
    val_ds = remaining_ds.take(val_size)
    test_ds = remaining_ds.skip(val_size)

    class_names = dataset.class_names
    num_classes = len(dataset.class_names)

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
          layers.RandomZoom(0.2),
          layers.RandomTranslation(0.1, 0.1),
          layers.RandomContrast(0.2),
          layers.RandomBrightness(0.2),
          layers.GaussianNoise(0.2)
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


async def send_training_update(epoch, logs, class_names):
    data = {
        'epoch': epoch,
        'accuracy': logs.get('accuracy'),
        'val_accuracy': logs.get('val_accuracy'),
        'loss': logs.get('loss'),
        'val_loss': logs.get('val_loss'),
        'class_names': class_names
    }

    message = json.dumps(data)
    tasks = [client.send_text(message) for client in clients]
    await asyncio.gather(*tasks)



class CustomCallback(tf.keras.callbacks.Callback):
    def __init__(self, class_names):
        super().__init__()
        self.class_names = class_names

    def on_epoch_end(self, epoch, logs=None):
        asyncio.run(send_training_update(epoch, logs, self.class_names))



def train_save_model(train_ds, validation_ds, num_classes: int, class_names: list[str], model_version: str):

    base_model = ResNet50(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3),
        pooling='avg'
    )

    for layer in base_model.layers:
        layer.trainable = False

    model = Sequential([
        base_model,
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])


    model.summary()

    model.compile(
        optimizer=Adam(learning_rate=1e-4),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )


    for layer in base_model.layers[-10:]:
        layer.trainable = True


    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )


    early_stopping, lr_scheduler, model_checkpoint = cb.training_callbacks(model_version=model_version)
    custom_callback = CustomCallback(class_names)

    fine_tune_history = model.fit(
        train_ds,
        epochs=20,
        validation_data=validation_ds,
        callbacks=[early_stopping, lr_scheduler, model_checkpoint, custom_callback]
    )

    model.summary()

    model.save(f'ClamScanner_v{model_version}.keras')

    return fine_tune_history




def train_new_model(DATASET_FOLDER, model_version):
    train_ds, val_ds, test_ds, num_classes, class_names = load_dataset(DATASET_FOLDER)

    train_ds = prepare(train_ds, shuffle=True, augment=True)
    val_ds =   prepare(val_ds)
    test_ds =  prepare(test_ds)

    fine_tune_history = train_save_model(train_ds, val_ds, num_classes, class_names, model_version)

    eval.plot_accuracy_loss(fine_tune_history)
    eval.evaluate_model(test_ds, model_version)

    
    train_acc = fine_tune_history.history['accuracy']
    val_acc = fine_tune_history.history['val_accuracy']
    train_loss = fine_tune_history.history['loss']
    val_loss = fine_tune_history.history['val_loss']

    return train_acc, val_acc, train_loss, val_loss