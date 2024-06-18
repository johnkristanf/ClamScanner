import tensorflow as tf
import numpy as np

from keras._tf_keras.keras.models import load_model
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

import matplotlib.pyplot as plt

def evaluate_model(test_ds: tf.data.Dataset, model_version: str):

    model = load_model(f'./models/ClamScanner_best_v{model_version}.keras')

    y_true = []
    y_pred = []

    for x, y in test_ds:
        y_pred_batch = model.predict(x)
        y_pred_batch_labels = np.argmax(y_pred_batch, axis=1)

        y_true.extend(y.numpy())
        y_pred.extend(y_pred_batch_labels)


    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    accuracy = accuracy_score(y_true, y_pred)

    conf_matrix = confusion_matrix(y_true, y_pred)

    class_report = classification_report(y_true, y_pred)

    print("Accuracy: ", accuracy)
    print("Confusion Matrix: \n", conf_matrix)
    print("Classification Report: \n", class_report)



def plot_accuracy_loss(history):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    # Plot accuracy
    ax1.plot(history.history['accuracy'], label='Train Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
    ax1.set_xlabel('Epochs')
    ax1.set_ylabel('Accuracy')
    ax1.set_title('Accuracy Over Epochs')
    ax1.legend()

    # Plot loss
    ax2.plot(history.history['loss'], label='Train Loss')
    ax2.plot(history.history['val_loss'], label='Validation Loss')
    ax2.set_xlabel('Epochs')
    ax2.set_ylabel('Loss')
    ax2.set_title('Loss Over Epochs')
    ax2.legend()

    plt.show()



