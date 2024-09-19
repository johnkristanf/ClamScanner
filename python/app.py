import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect

import threading
import uvicorn
import asyncio


import boto3
from botocore.config import Config

from ws_client import clients

from upload.upload_ds_image import DatasetDatabaseOperations, DatasetImageUploadMethod
from cache.redis import RedisCachingMethods
from ML.chat import ChatBotService
from ML.predict import ClamPrediction
from train.process_train import train_new_model

app = FastAPI()

# comment this out when you push to production cause the nginx configuration 
# is handling the cors to avoid duplication error

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  
#     allow_credentials=True,
#     allow_methods=["*"],  
#     allow_headers=["*"], 
# )

load_dotenv('.env')

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

chatbot = ChatBotService()
dataset_db_ops = DatasetDatabaseOperations()
dataset_upload_ops = DatasetImageUploadMethod()
predict = ClamPrediction()
redis = RedisCachingMethods()

s3_config = Config(s3={'use_accelerate_endpoint': True})
DATASET_PREFIX = 'datasets'
BUCKET_NAME = "clamscanner-bucket"


s3 = boto3.client(
    "s3",
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name = "us-east-1",
    config=s3_config
)



def list_folders_and_images_in_dataset():
    try:
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f"{DATASET_PREFIX}/")

        if 'Contents' in response:
            for obj in response['Contents']:
                key = obj['Key']
                if key.endswith('/'):
                    print(f"Folder: {key}")
                else:
                    print(f"Image: {key}")
        else:
            print("No folders or images found in the datasets folder")

    except Exception as e:
        print(f"Error: {str(e)}")

# list_folders_and_images_in_dataset()

def delete_all_objects():
    try:
        objects = s3.list_objects_v2(Bucket=BUCKET_NAME)

        if 'Contents' in objects:
            keys = [{'Key': obj['Key']} for obj in objects['Contents']]
            
            s3.delete_objects(
                Bucket=BUCKET_NAME,
                Delete={
                    'Objects': keys
                }
            )
            print(f"Deleted {len(keys)} objects from {BUCKET_NAME}")
        else:
            print(f"No objects found in {BUCKET_NAME}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

# delete_all_objects()

async def upload_image(image: UploadFile, datasetClass: str):
    s3_key = f"{DATASET_PREFIX}/{datasetClass}/{image.filename}"

    try:
        s3.upload_fileobj(
            image.file, 
            BUCKET_NAME, 
            s3_key, 
            ExtraArgs={'ContentType': image.content_type}
        )

        return {"filename": image.filename, "s3_key": s3_key}
        
    except Exception as e:
        print(f"Error uploading image {image.filename}: {e}")
        return None
        

async def batch_upload_images(images: list[UploadFile], datasetClass: str, batch_size: int = 10):
    results = []

    for i in range(0, len(images), batch_size):
        batch = images[i:i + batch_size]

        upload_task = [upload_image(image, datasetClass) for image in batch]
        results += await asyncio.gather(*upload_task)

    return results


@app.post("/upload/dataset/images")
async def upload_images(
    datasetClass: str = Form(...), 
    class_id: str = Form(...), 
    images: list[UploadFile] = File(...)
):
    try:

        upload_results = await batch_upload_images(images, datasetClass, batch_size=10)

        if not upload_results:
            return JSONResponse(content={"message": "No images were uploaded"}, status_code=400)
        
        cache_key = f"{DATASET_PREFIX}/{datasetClass}/image_urls"

        # use this for large dataset size and changes are not frequent (production)
        # redis.DELETE(cache_key)


        # use this for low to medium dataset size and changes are frequent (development)

        for result in upload_results:
            if result:
                presigned_url = s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': BUCKET_NAME, 'Key': result['s3_key']},
                )
                
                new_image_data = {'key': result['s3_key'], 'url': presigned_url}
                redis.APPEND_TO_CACHED_URLS(cache_key, new_image_data)

        img_count = len(redis.GET(cache_key))
        print("img_count: ", img_count)
        dataset_db_ops.update_dataset_class_data(img_count, class_id)
        
        return JSONResponse(content={"message": "Image Uploaded Successfully"}, status_code=201)


    except Exception as e:
        print(f"Error during upload: {e}")
        return HTTPException(status_code=500, detail=str(e))


@app.get("/fetch/images/{datasetClass}")
async def fetch_images(datasetClass: str):

    cache_key = f"{DATASET_PREFIX}/{datasetClass}/image_urls"
    cached_image_data = redis.GET(cache_key)

    if cached_image_data is not None:
        print(f"Cached hit for key: {cache_key}")
        return JSONResponse(content={"image_data": cached_image_data}, status_code=200)
        

    prefix = f"{DATASET_PREFIX}/{datasetClass}/"

    response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)

    if 'Contents' in response:
        image_data = [
            {
                'key': obj['Key'],
                'url': s3.generate_presigned_url(
                            'get_object',
                            Params={'Bucket': BUCKET_NAME, 'Key': obj['Key']},
                        ) 
            }
           
            for obj in response['Contents'] if obj['Key'].lower().endswith(('jpg', 'jpeg', 'png'))
        ]

        redis.SET(cache_key, image_data)

        return JSONResponse(content={"image_data": image_data}, status_code=200)
    
    return JSONResponse(content={"image_data": []}, status_code=200)


@app.post('/delete/image')
async def delete_dataset_image(data: dict):
    try:

        image_keys = data.get('image_keys')
        class_id = data.get('class_id')

        datasetClass = data.get('datasetClass')
        cache_key = f"{DATASET_PREFIX}/{datasetClass}/image_urls"

        if not image_keys:
            raise HTTPException(status_code=400, detail="No image keys provided")

        objects_to_delete = [{'Key': key} for key in image_keys]
        
        s3.delete_objects(
            Bucket=BUCKET_NAME,
            Delete={
                'Objects': objects_to_delete
            }
        )

        img_count = len(redis.GET(cache_key)) - len(image_keys)
        dataset_db_ops.update_dataset_class_data(img_count, class_id)
        redis.DELETE(cache_key)
        

        return JSONResponse(content={"message": f"Deleted {len(image_keys)} images successfully"}, status_code=200)
        

    except Exception as e:
        print("Error during deletion image processing:", e)
        return JSONResponse(content={"error": "Image deletion failed"}, status_code=500)


@app.post("/delete/dataset/class")
async def delete_dataset_class(data: dict):

    try:
        key_path = data.get('folder_path')
        cache_key = f"{key_path}/image_urls"

        objects = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=key_path)

        if 'Contents' in objects:
            keys = [
                {'Key': obj['Key'] } 
                for obj in objects['Contents'] 
                if obj['Key'].lower().endswith(('jpg', 'jpeg', 'png'))

            ]
            
            s3.delete_objects(
                Bucket=BUCKET_NAME,
                Delete={
                    'Objects': keys
                }
            )

            redis.DELETE(cache_key)

        return JSONResponse(content={"success": "Dataset Class Deleted!"}, status_code=200)

    except Exception as e:
        print(f"Error dataset class deletion: {e}")
        return HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            print(f"Received message: {message}")
    except WebSocketDisconnect:
        print(f"Client disconnected: {websocket.client}")
        clients.remove(websocket)
    except Exception as e:
        print(f"Error: {e}")
        clients.remove(websocket)



@app.post("/train/model")
async def train(data: dict):
    
    def train_model_async(data):
        model_version = data.get('version')
        train_new_model(model_version)
        # return {
        #     "version": f'ClamScanner_v{model_version}',
        #     "train_accuracy": train_acc,
        #     "validation_accuracy": val_acc,
        #     "train_loss": train_loss,
        #     "validation_loss": val_loss
        # }

    thread = threading.Thread(target=train_model_async, args=(data,))
    thread.start()
    return JSONResponse(content={"status": "Training started"}, status_code=200)



@app.post("/image/scan")
async def scan(captured_image_file: UploadFile = File(...)):
    file_path = None

    try:
        filename = secure_filename(captured_image_file.filename)
        file_path = os.path.join('./', filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(captured_image_file.file.read())

        mollusk_classified_result = predict.mollusk_predict(file_path)
        response_data = {
            "mollusk_classified_result": mollusk_classified_result
        }
        print(f'response_data {response_data}')
        return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        print("Error during image processing:", e)
        return JSONResponse(content={"error": "Image processing failed"}, status_code=500)

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)



@app.post("/message/chatbot")
async def chat(data: dict):
    try:
        user_input = data.get("message")
        if user_input:
            response = chatbot.get_responses(user_input)
            return JSONResponse(content={"response": response}, status_code=200)
        
        else:
            raise HTTPException(status_code=400, detail="No message provided")
    except Exception as e:
        print("Error during chat process:", e)
        return JSONResponse(content={"error_occured": "An error occurred while processing your request. Please try again later or contact support for assistance."}, status_code=500)


if __name__ == "__main__":
    # uvicorn app:app --host 0.0.0.0 --port 5000 --reload

    print("Fast API Server HTTPS Listens to Port 5000")
    uvicorn.run(app, port=5000, host='0.0.0.0')
