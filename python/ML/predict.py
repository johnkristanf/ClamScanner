import os
import boto3
import numpy as np
from dotenv import load_dotenv

from PIL import Image
from keras._tf_keras.keras.applications.resnet import preprocess_input
from keras._tf_keras.keras.saving import load_model
from keras._tf_keras.keras.optimizers import Adam

from database.predict_db_operations import PredictDatabaseOperations

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))


s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

BUCKET_NAME = 'clamscanner-bucket'
DATASET_PREFIX = 'datasets/'
predict = PredictDatabaseOperations()

class ClamPrediction():
    def __init__(self):
        self.model_path = os.path.abspath("./models/ClamScanner_best_v6.h5")
        self.model = self.load_resnetmodel()

    def get_prediction_percentage(self, predictions):
        predictions_flat = predictions.flatten() 
        predictions_percentage = predictions_flat * 100  

        predicted_class_index = np.argmax(predictions_flat) 
        predicted_class_percentage = predictions_percentage[predicted_class_index] 
        predicted_class_percentage_str = f"{predicted_class_percentage:.2f}%"

        return predicted_class_percentage_str

    def load_resnetmodel(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file does not exist: {self.model_path}")

        model = load_model(self.model_path)

        model.compile(optimizer=Adam(learning_rate=1e-4), loss='sparse_categorical_crossentropy', metrics=['accuracy'])
        print("Model recompiled successfully.")

        return model


    def load_dataset_classes(self):
        CLASSES = predict.load_dataset_class_names()
        print("CLASSES IN PREDICT: ", CLASSES)
        return CLASSES


    def resize_and_preprocess_image(self, image_path):
        img = Image.open(image_path)
        img = img.resize((224, 224))
        img = preprocess_input(np.array(img))
        return np.expand_dims(img, axis=0)


    def mollusk_predict(self, image_path):
        print("PREDICT")
        preprocessed_image = self.resize_and_preprocess_image(image_path)
        predictions = self.model.predict(preprocessed_image)

        # CLASSES = ['Blood Clam', 'BullMouth Helmet', 'Horn Snail', 'Invalid Image', 'Mussel', 'Oyster', 'Scaly Clam', 'Tiger Cowrie']
        CLASSES = self.load_dataset_classes()
        print("CLASSES", CLASSES)

        predicted_class_percentage_str = self.get_prediction_percentage(predictions)

        print("Predictions in percentage:", predicted_class_percentage_str)


        mollusk_classified_result = CLASSES[np.argmax(predictions)]
        return mollusk_classified_result, predicted_class_percentage_str


    def load_validate_image_file(self, request, jsonify):

        if 'captured_image_file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['captured_image_file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        return file
        


