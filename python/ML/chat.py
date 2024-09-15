import os

import random
import joblib
import boto3
from dotenv import load_dotenv

from cache.redis import RedisCachingMethods
from database.chatbot_db_operations import ChatBotDatabaseOperations

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

PIPELINE_PATH = os.path.abspath("./models/nlp_pipeline.pkl")
LABEL_ENCODER_PATH = os.path.abspath("./models/label_encoder.pkl")
redis = RedisCachingMethods()


s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

BUCKET_NAME = 'clamscanner-bucket'
DATASET_PREFIX = 'datasets'

class DatasetCountResponse:
    def __init__(self):
        self.extensions = ('jpg', 'jpeg', 'png')

    
    def count_total_dataset_images(self):
        total_dataset_images = redis.COUNT_TOTAL_DATASET()
        print("total_dataset_images: ", total_dataset_images)

        if total_dataset_images:
            return total_dataset_images
        
        return 0


    # def count_total_dataset_images(self):

    #     response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=DATASET_PREFIX)

    #     if 'Contents' in response:
    #         total_count = sum(
    #             1
    #             for obj in response['Contents']
    #             if obj['Key'].lower().endswith(self.extensions)
    #         )

    #         print("total_count: ", total_count)

    #         return total_count

    #     return 0
    
    # def count_dataset_images_class(self, class_name):
    #     prefix = f"{DATASET_PREFIX}{class_name}/"
    #     response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)

    #     if 'Contents' in response:
    #         total_count = sum(
    #             1
    #             for obj in response['Contents']
    #             if obj['Key'].lower().endswith(self.extensions)
    #         )

    #         return total_count

    #     return 0

    def count_dataset_images_class(self, datasetClass):
      cache_key = f"{DATASET_PREFIX}/{datasetClass}/image_urls"
      image_data = redis.GET(cache_key)

      if image_data:
        return len(image_data)
        
      return 0
          


    
       

class ChatClasses:
    HORNSNAIL    = "Horn Snail"
    BLOODCLAM    = "Blood Clam"
    MUSSEL       = "Mussel"
    OYSTER       = "Oyster"
    SCALYCLAM    = "Scaly Clam"
    TIGERCOWRIE  = "Tiger Cowrie"
    BULLMOUTHHELMET   = "BullMouth Helmet"
    INVALIDIMAGE = "Invalid Image"

    DAVAO_DEL_NORTE    = "Davao Del Norte"
    DAVAO_DEL_SUR      = "Davao Del Sur"
    DAVAO_ORIENTAL     = "Davao Oriental"
    DAVAO_OCCIDENTAL   = "Davao Occidental"
    COMPOSTELA_VALLEY  = "Compostela Valley"

    DAVAO_CITY         = "Davao City"
    TAGUM_CITY         = "Tagum City"
    PANABO_CITY        = "Panabo City"

    PROVINCE           = "province"
    CITY               = "city"
    MOLLUSK_TYPE       = "mollusk_type"

    

class ChatBotService:
    def __init__(self):
        self.counter        = DatasetCountResponse()
        self.db_operations  = ChatBotDatabaseOperations()

        self.responses = {
            # "total_dataset_images": self.format_overall_images_count(),
            
            # "class_images_horn_snail":          self.format_images_count(ChatClasses.HORNSNAIL),
            # "class_images_mussel":              self.format_images_count(ChatClasses.MUSSEL),
            # "class_images_oyster":              self.format_images_count(ChatClasses.OYSTER),
            # "class_images_blood_clam":          self.format_images_count(ChatClasses.BLOODCLAM),

            # "class_images_bullmouth_helmet":    self.format_images_count(ChatClasses.BULLMOUTH_HELMET),
            # "class_images_scaly_clam":          self.format_images_count(ChatClasses.SCALYCLAM),
            # "class_images_tiger_cowrie":        self.format_images_count(ChatClasses.TIGERCOWRIE),

            # "class_images_invalid_image":       self.format_images_count(ChatClasses.INVALIDIMAGE),


            # responses for report per dataset class in provinces and cities (Scaly clam)
            "class_reports_scaly_clam_davao_del_norte":     self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.PROVINCE, ChatClasses.DAVAO_DEL_NORTE),
            "class_reports_scaly_clam_davao_del_sur":       self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.PROVINCE, ChatClasses.DAVAO_DEL_SUR),
            "class_reports_scaly_clam_davao_oriental":      self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.PROVINCE, ChatClasses.DAVAO_ORIENTAL),
            "class_reports_scaly_clam_davao_occidental":    self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.PROVINCE, ChatClasses.DAVAO_OCCIDENTAL),
            "class_reports_scaly_clam_compostela_valley":   self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.PROVINCE, ChatClasses.COMPOSTELA_VALLEY),

            "class_reports_scaly_clam_davao_city":      self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.CITY, ChatClasses.DAVAO_CITY),
            "class_reports_scaly_clam_panabo_city":     self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.CITY, ChatClasses.PANABO_CITY),
            "class_reports_scaly_clam_tagum_city":      self.format_reports_mollusk_type_location_type(ChatClasses.SCALYCLAM, ChatClasses.CITY, ChatClasses.TAGUM_CITY),


            # responses for report per dataset class in provinces and cities (BullMouth Helmet)
            "class_reports_bullmouth_helmet_davao_del_norte":   self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.PROVINCE, ChatClasses.DAVAO_DEL_NORTE),
            "class_reports_bullmouth_helmet_davao_del_sur":     self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.PROVINCE, ChatClasses.DAVAO_DEL_SUR),
            "class_reports_bullmouth_helmet_davao_oriental":    self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.PROVINCE, ChatClasses.DAVAO_ORIENTAL),
            "class_reports_bullmouth_helmet_davao_occidental":  self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.PROVINCE, ChatClasses.DAVAO_OCCIDENTAL),
            "class_reports_bullmouth_helmet_compostela_valley": self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.PROVINCE, ChatClasses.COMPOSTELA_VALLEY),

            "class_reports_bullmouth_helmet_davao_city":    self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.CITY, ChatClasses.DAVAO_CITY),
            "class_reports_bullmouth_helmet_panabo_city":   self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.CITY, ChatClasses.PANABO_CITY),
            "class_reports_bullmouth_helmet_tagum_city":    self.format_reports_mollusk_type_location_type(ChatClasses.BULLMOUTHHELMET, ChatClasses.CITY, ChatClasses.TAGUM_CITY),



            # responses for report per dataset class in provinces and cities (Tiger Cowrie)
            "class_reports_tiger_cowrie_davao_del_norte":    self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.PROVINCE, ChatClasses.DAVAO_DEL_NORTE),
            "class_reports_tiger_cowrie_davao_del_sur":      self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.PROVINCE, ChatClasses.DAVAO_DEL_SUR),
            "class_reports_tiger_cowrie_davao_oriental":     self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.PROVINCE, ChatClasses.DAVAO_ORIENTAL),
            "class_reports_tiger_cowrie_davao_occidental":   self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.PROVINCE, ChatClasses.DAVAO_OCCIDENTAL),
            "class_reports_tiger_cowrie_compostela_valley":  self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.PROVINCE, ChatClasses.COMPOSTELA_VALLEY),

            "class_reports_tiger_cowrie_davao_city":    self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.CITY, ChatClasses.DAVAO_CITY),
            "class_reports_tiger_cowrie_panabo_city":   self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.CITY, ChatClasses.PANABO_CITY),
            "class_reports_tiger_cowrie_tagum_city":    self.format_reports_mollusk_type_location_type(ChatClasses.TIGERCOWRIE, ChatClasses.CITY, ChatClasses.TAGUM_CITY),


            # responses for reports per provinces
            "location_reports_davao_del_norte":     self.format_reports_response_province(ChatClasses.DAVAO_DEL_NORTE),
            "location_reports_davao_del_sur":       self.format_reports_response_province(ChatClasses.DAVAO_DEL_SUR),
            "location_reports_davao_oriental":      self.format_reports_response_province(ChatClasses.DAVAO_ORIENTAL),
            "location_reports_davao_occidental":    self.format_reports_response_province(ChatClasses.DAVAO_OCCIDENTAL),
            "location_reports_compostela_valley":   self.format_reports_response_province(ChatClasses.COMPOSTELA_VALLEY),


            # responses for total reports in all provinces, cities, mollusk type
            "reports_all_provinces":    self.format_all_reports(ChatClasses.PROVINCE),
            "reports_all_cities":       self.format_all_reports(ChatClasses.CITY),
            "reports_all_mollusk_type": self.format_all_reports(ChatClasses.MOLLUSK_TYPE),


            # responses for total reports per city
            "location_reports_davao_city":  self.format_reports_response_city(ChatClasses.DAVAO_CITY),
            "location_reports_panabo_city": self.format_reports_response_city(ChatClasses.PANABO_CITY),
            "location_reports_tagum_city":  self.format_reports_response_city(ChatClasses.TAGUM_CITY),


            # responses for total reports per mollusk type
            "class_reports_scaly_clam":         self.format_reports_response_mollusk_type(ChatClasses.SCALYCLAM),
            "class_reports_bullmouth_helmet":   self.format_reports_response_mollusk_type(ChatClasses.BULLMOUTHHELMET),
            "class_reports_tiger_cowrie":       self.format_reports_response_mollusk_type(ChatClasses.TIGERCOWRIE),

            # responses for average reports in all provinces, cities, mollusk type
            "average_reports_all_provinces":    self.format_average_reports(ChatClasses.PROVINCE), 
            "average_reports_all_cities":       self.format_average_reports(ChatClasses.CITY),
            "average_reports_all_mollusk_type": self.format_average_reports(ChatClasses.MOLLUSK_TYPE),


            # responses for dataset uploading guide
            "dataset_upload_suggestion": self.get_training_guides()
        }

        self.pipeline = joblib.load(PIPELINE_PATH)
        self.label_encoder = joblib.load(LABEL_ENCODER_PATH)


    def get_responses(self, user_input):
        intent = self.pipeline.predict([user_input])
        intent_label = self.label_encoder.inverse_transform(intent)[0]
        print("intent_label: ", intent_label)

        if intent_label == "total_dataset_images":
            return self.format_overall_images_count()

        elif intent_label.startswith("class_images_"):
            dataset_class = intent_label.split("class_images_")[1]
            dataset_class = dataset_class.replace("_", "")  
            return self.format_images_count(getattr(ChatClasses, dataset_class.upper()))

        self.responses["dataset_upload_suggestion"] = self.get_training_guides()
        chatbot_limitation_response = "I'm sorry, but that question is beyond my capabilities. Please ask something else."

        return self.responses.get(intent_label, chatbot_limitation_response)
    
    def get_training_guides(self):
        guides = [
            "To train a ResNet50 model successfully, begin by collecting at least 100–200 images for each class; for best results, aim for 1,000–5,000 images per class. \n\nMake that all of the photographs in your dataset are consistently cropped or shrunk to 224x224 pixels. \n\nThen thoroughly clean the dataset by removing any duplicates or low-quality images. \n\nMake sure each class has an equal amount of photographs in order to prevent prejudice. \n\nDepending on the level of difficulty of the work, the number of classes should be determined as follows: up to 10 for easier projects, between 10 and 50 for intermediate problems, and more than 50 for complex assignments.",
            "To prepare your image dataset for training a ResNet50 model, ensure you have 100-200 images per class at a minimum, with 1,000 to 5,000 images per class being ideal for better performance. \n\nClean the data by removing duplicates and low-quality images, and ensure all images are resized or cropped to 224x224 pixels. \n\nMaintain a balanced distribution of images across classes to avoid bias, and choose the number of classes based on task complexity: up to 10 for simpler tasks, 10-50 for moderate complexity, and 50+ for more extensive scenarios.",
            "Make sure each class in your picture collection for ResNet50 training has at least 100–200 photos; for best results, aim for 1,000–5,000 images. \n\nSort through your dataset, eliminating any duplicates and poor-quality photos. \n\nThen, resize each image to 224 by 224 pixels. \n\nTo avoid bias, keep the distribution of photos uniform across all classes. \n\nDepending on how difficult the assignment is, you can have as little as 10 classes for simple tasks, between 10 and 50 for intermediate tasks, and more than 50 for complicated cases."
        ]

        return random.choice(guides)
    
    
    def format_all_reports(self, REPORT_TYPE):
        reports = self.db_operations.get_all_reports_location(REPORT_TYPE)
        return f'Total reports in {REPORT_TYPE}: \n\n{reports}'.replace(',', '\n')
    
    def format_average_reports(self, REPORT_TYPE):
        reports = self.db_operations.get_average_reports_location(REPORT_TYPE)
        return f'The Average Report in {REPORT_TYPE}: \n\n{reports}'.replace(',', '\n')
    

    def format_overall_images_count(self):
        count = self.counter.count_total_dataset_images()
        return f'The Total Count of Dataset Image is {count} image{"s" if count > 1 else ""}'
    
    def format_images_count(self, DATASET_CLASS):
        count = self.counter.count_dataset_images_class(DATASET_CLASS)
        return f'Dataset Class {DATASET_CLASS} has a total of {count} image{"s" if count > 1 else ""}'
    

    def format_reports_response_province(self, PROVINCE):
        reports = self.db_operations.get_reports_per_provinces(PROVINCE)
        return f'Total reports of province {PROVINCE} is {reports} report{"s" if reports > 1 else ""}'
        

    def format_reports_response_city(self, CITY):
        reports = self.db_operations.get_reports_per_city(CITY)
        return f'Total reports of city {CITY} is {reports} report{"s" if reports > 1 else ""}'
    

    def format_reports_response_mollusk_type(self, MOLLUSK_TYPE):
        reports = self.db_operations.get_reports_per_mollusk_type(MOLLUSK_TYPE)
        return f'Total reports of endangered mollusk {MOLLUSK_TYPE} is {reports} report{"s" if reports > 1 else ""}',


    def format_reports_mollusk_type_location_type(self, MOLLUSK_TYPE, LOCATION_TYPE, LOCATION):
        reports = self.db_operations.get_reports_mollusk_type_locations(MOLLUSK_TYPE, LOCATION_TYPE, LOCATION)
        return f'Total Reports of {MOLLUSK_TYPE} in {LOCATION} is {reports} report{"s" if reports > 1 else ""}'