import io
import os
import unittest
from PIL import Image
from app import app
from werkzeug.datastructures import FileStorage

import websockets
import threading
import asyncio

from python.ws_s3_client import clients


class APITestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app_thread = threading.Thread(target=app.run, kwargs={'port': 5000})
        cls.app_thread.start()
        asyncio.sleep(1)

    @classmethod
    def tearDownClass(cls):
        cls.app_thread.join()


    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        self.create_directories()

    def create_directories(self):
        os.makedirs('datasets', exist_ok=True)


    def create_test_image(self):
        img = Image.new('RGB', (224, 224), color=(73, 109, 137))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        return img_byte_arr


    def test_image_scanning(self):
        for i in range(1, 100):
            mock_form_data_image = self.create_test_image()
            file_storage = FileStorage(mock_form_data_image, filename=f'test_image_{i}.jpg')
            data = {
                'captured_image_file': file_storage
            }
            
            response = self.client.post("/image/scan", data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 200, f"Failed on image {i}")
            self.assertIn("mollusk_classified_result", response.json, f"Failed on image {i}")


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
            "folder_path": "datasets"
        }
        response = self.client.post("/add/dataset/class", json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json)
        self.assertEqual(response.json["success"], "Dataset Class Added!")


    def test_delete_dataset_class(self):
        data = {
            "folder_path": "datasets"
        }
        response = self.client.post("/delete/dataset/class", json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json)
        self.assertEqual(response.json["success"], "Dataset Class Deleted!")


    def test_upload_images(self):
        CLASSES = ['Blood Clam', 'BullMouth Helmet', 'Horn Snail', 'Invalid Image', 'Mussel', 'Oyster', 'Scaly Clam', 'Tiger Cowrie']

        for index, value in enumerate(CLASSES):
            mock_upload_images = [self.create_test_image() for _ in range(10)]  
            file_storages = [('images', FileStorage(mock_image, filename=f'{value}_{index}.jpg')) for i, mock_image in enumerate(mock_upload_images)]
            
            data = {
                'datasetClass': value,
                'class_id': index
            }
            data.update(file_storages)
            
            response = self.client.post("/upload/dataset/images", data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data.decode(), 'Image Uploaded Successfull')


    async def connect_websocket(self, uri):
        async with websockets.connect(uri) as websocket:
            await websocket.send("Hello, WebSocket!")
       
            self.assertEqual(len(clients), 1)
            self.assertEqual(clients[0], websocket)

            await websocket.close()

            self.assertEqual(len(clients), 0)

    def test_websocket_connection(self):
        uri = "ws://localhost:5000/ws"
        asyncio.run(self.connect_websocket(uri))

if __name__ == "__main__":
    unittest.main()
