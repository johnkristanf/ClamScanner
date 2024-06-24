import io
import unittest
from PIL import Image
from app import app
from werkzeug.datastructures import FileStorage

class MLIntegrationTestCase(unittest.TestCase):

    def setUp(self) -> None:
        app.config['TESTING'] = True
        self.client = app.test_client()


    def create_test_image(self):
        img = Image.new('RGB', (224, 224), color = (73, 109, 137))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        return img_byte_arr


    def test_image_scanning(self):
        for i in range(1, 6):
            mock_form_data_image = self.create_test_image() 
            file_storage = FileStorage(mock_form_data_image, filename=f'test_image_{i}.jpg')
            data = {
                'captured_image_file': file_storage
            }
            
            response = self.client.post("/image/scan", data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 200, f"Failed on image {i}")
            self.assertIn("mollusk_classified_result", response.json, f"Failed on image {i}")


    # error sa testing kay walay images imong datasets folder kapoy nag upload 
    # ugma napod hahahahaha 
    def test_train_model(self):
        data = {
            "version": "1.0"
        }
        response = self.client.post("/train/model", json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("status", response.json)
        self.assertEqual(response.json["status"], "Training started")


    def test_add_dataset_class(self):
        data = {
            "folder_path": "new_dataset_class"
        }
        response = self.client.post("/add/dataset/class", json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json)
        self.assertEqual(response.json["success"], "Dataset Class Added!")


    def test_delete_dataset_class(self):
        data = {
            "folder_path": "new_dataset_class"
        }
        response = self.client.post("/delete/dataset/class", json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json)
        self.assertEqual(response.json["success"], "Dataset Class Deleted!")


    def test_upload_images(self):
        mock_upload_image = self.create_test_image() 

        file_storage = FileStorage(mock_upload_image, filename='test_image.jpg')
        data = {
            'datasetClass': 'new_dataset_class',
            'class_id': '1',
            'images': file_storage
        }
        response = self.client.post("/upload/dataset/images", data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.decode(), 'Image Uploaded Successfull')


if __name__ == "__main__":
    unittest.main()
