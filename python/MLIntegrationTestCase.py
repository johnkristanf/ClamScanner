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


if __name__ == "__main__":
    unittest.main()
