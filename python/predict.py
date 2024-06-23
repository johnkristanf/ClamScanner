import os
import numpy as np

from PIL import Image
from keras._tf_keras.keras.applications.resnet import preprocess_input
from keras._tf_keras.keras.saving import load_model
from keras._tf_keras.keras.optimizers import Adam

print("WORKING DIR:", os.getcwd())

model_path = os.path.abspath("./models/ClamScanner_best_v3.h5")

def load_resnet_model():
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file does not exist: {model_path}")

    global resnet_model
    resnet_model = load_model(model_path)
    print("Model loaded successfully.")

    resnet_model.compile(optimizer=Adam(learning_rate=1e-4), loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    print("Model recompiled successfully.")


load_resnet_model()

def load_dataset_classes():
    global CLASSES 
    CLASSES = [file.name for file in os.scandir("datasets") if file.is_dir()]

load_dataset_classes()


def resize_and_preprocess_image(image_path):
    img = Image.open(image_path)
    img = img.resize((224, 224))
    img = preprocess_input(np.array(img))
    return np.expand_dims(img, axis=0)


def mollusk_predict(image_path):
    print("PREDICT")
    preprocessed_image = resize_and_preprocess_image(image_path)
    predictions = resnet_model.predict(preprocessed_image)

    print("predictions", predictions)

    # CLASSES = ['Blood Clam', 'BullMouth Helmet', 'Horn Snail', 'Invalid Image', 'Mussel', 'Oyster', 'Scaly Clam', 'Tiger Cowrie']
    print("CLASSES", CLASSES)

    mollusk_classified_result = CLASSES[np.argmax(predictions)]
    return mollusk_classified_result


def load_validate_image_file(request, jsonify):

    if 'captured_image_file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['captured_image_file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    return file
    
