import os

import random
import joblib
import glob

PIPELINE_PATH = os.path.abspath("./models/nlp_pipeline.pkl")
LABEL_ENCODER_PATH = os.path.abspath("./models/label_encoder.pkl")

class DatasetCountResponse:
    def __init__(self):
        self.DATASET_ROOT_FOLDER = os.path.abspath('datasets')
        self.extensions = ('*.jpg', '*.jpeg', '*.png')

    def count_total_dataset_images(self):
        total_count = 0 

        for subfolder in os.listdir(self.DATASET_ROOT_FOLDER):
            subfolder_path = os.path.join(self.DATASET_ROOT_FOLDER, subfolder)

            if os.path.isdir(subfolder_path):
                for ext in self.extensions:
                    files = glob.glob(os.path.join(subfolder_path, ext))
                    total_count += len(files)

        return total_count
    
    def count_total_dataset_images_per_class(self, subfolder):
        total_count = 0 

        subfolder_path = os.path.join(self.DATASET_ROOT_FOLDER, subfolder)

        if os.path.isdir(subfolder_path):
            for ext in self.extensions:
                files = glob.glob(os.path.join(subfolder_path, ext))
                total_count += len(files)

        return total_count
    
class DatasetGuideResponse:
    def __init__(self):
        self.guides = [
            "To train a ResNet50 model successfully, begin by collecting at least 100–200 images for each class; for best results, aim for 1,000–5,000 images per class. Make that all of the photographs in your dataset are consistently cropped or shrunk to 224x224 pixels, then thoroughly clean the dataset by removing any duplicates or low-quality images. Make sure each class has an equal amount of photographs in order to prevent prejudice. Depending on the level of difficulty of the work, the number of classes should be determined as follows: up to 10 for easier projects, between 10 and 50 for intermediate problems, and more than 50 for complex assignments.",
            "To prepare your image dataset for training a ResNet50 model, ensure you have 100-200 images per class at a minimum, with 1,000 to 5,000 images per class being ideal for better performance. Clean the data by removing duplicates and low-quality images, and ensure all images are resized or cropped to 224x224 pixels. Maintain a balanced distribution of images across classes to avoid bias, and choose the number of classes based on task complexity: up to 10 for simpler tasks, 10-50 for moderate complexity, and 50+ for more extensive scenarios.",
            "Make sure each class in your picture collection for ResNet50 training has at least 100–200 photos; for best results, aim for 1,000–5,000 images. Sort through your dataset, eliminating any duplicates and poor-quality photos. Then, resize each image to 224 by 224 pixels. To avoid bias, keep the distribution of photos uniform across all classes. Depending on how difficult the assignment is, you can have as little as 10 classes for simple tasks, between 10 and 50 for intermediate tasks, and more than 50 for complicated cases."
        ]

    def get_guides(self):
        return random.choice(self.guides)

    

class ChatBot:
    def __init__(self):
        self.dataset_counter = DatasetCountResponse()
        self.dataset_guide   = DatasetGuideResponse()

        self.SUBFOLDER_HORNSNAIL    = "Horn Snail"
        self.SUBFOLDER_BLOODCLAM    = "Blood Clam"
        self.SUBFOLDER_MUSSEL       = "Mussel"
        self.SUBFOLDER_OYSTER       = "Oyster"
        self.SUBFOLDER_SCALYCLAM    = "Scaly Clam"
        self.SUBFOLDER_TIGERCOWRIE  = "Tiger Cowrie"
        self.SUBFOLDER_BULLMOUTH    = "BullMouth Helmet"
        self.SUBFOLDER_INVALIDIMAGE = "Invalid Image"
        
        self.responses = {
            "total_dataset_images": f'The Total amount of dataset images are {self.dataset_counter.count_total_dataset_images()} images',
            
            "class_images_horn_snail": f'Dataset Class Horn Snail has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_HORNSNAIL)} images',
            "class_images_mussel": f'Dataset Class Mussel has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_MUSSEL)} images',
            "class_images_oyster": f'Dataset Class Oyster has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_OYSTER)} images',
            "class_images_blood_clam": f'Dataset Class Blood Clam has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_BLOODCLAM)} images',
            "class_images_bullmouth_helmet": f'Dataset Class BullMouth Helmet has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_BULLMOUTH)} images',
            "class_images_scaly_clam": f'Dataset Class Scaly Clam has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_SCALYCLAM)} images',
            "class_images_tiger_cowrie": f'Dataset Class Tiger Cowrie has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_TIGERCOWRIE)} images',
            "class_images_invalid_image": f'Dataset Class Invalid Image has a total images of {self.dataset_counter.count_total_dataset_images_per_class(self.SUBFOLDER_INVALIDIMAGE)} images',

            "dataset_upload_suggestion": self.dataset_guide.get_guides()
        }

        self.pipeline = joblib.load(PIPELINE_PATH)
        self.label_encoder = joblib.load(LABEL_ENCODER_PATH)

    def get_responses(self, user_input):
        intent = self.pipeline.predict([user_input])
        intent_label = self.label_encoder.inverse_transform(intent)[0]
        print("intent_label: ", intent_label)

        chatbot_limitation_response = "I'm sorry, but that question is beyond my capabilities. Please ask something else."
        self.responses["dataset_upload_suggestion"] = self.dataset_guide.get_guides()
        
        return self.responses.get(intent_label, chatbot_limitation_response)
