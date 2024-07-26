import os
from dotenv import load_dotenv

from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify

from flask_cors import CORS
from ws_client import clients
from fastapi.middleware.cors import CORSMiddleware

from upload.upload_ds_image import DatasetDatabaseOperations, DatasetImageUploadMethod
from ML.chat import ChatBotService
from ML.predict import ClamPrediction

from train.process_train import train_new_model
from fastapi import FastAPI, WebSocket, WebSocketDisconnect


import threading
import uvicorn


ws_app = FastAPI()
app = Flask(__name__)

CORS(app)
load_dotenv('.env')

ws_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
DATASET_FOLDER = os.path.abspath('datasets')

chatbot = ChatBotService()
dataset_db_ops = DatasetDatabaseOperations()
dataset_upload_ops = DatasetImageUploadMethod()
predict = ClamPrediction()



@app.post("/add/dataset/class")
def add_dataset():
    data = request.get_json()
    
    folder_path = data['folder_path']

    dataset_upload_ops.add_new_dataset_class(folder_path)
    return jsonify({"success": "Dataset Class Added!"}), 200



@app.post("/delete/dataset/class")
def delete_dataset():
    data = request.get_json()
    
    folder_path = data['folder_path']

    dataset_upload_ops.delete_dataset_class(folder_path)
    return jsonify({"success": "Dataset Class Deleted!"}), 200



@app.post("/upload/dataset/images")
def upload_images():
    dataset_class = request.form.get('datasetClass')
    class_id = request.form.get('class_id')

    print("dataset_class: ", dataset_class)
    print("class_id: ", class_id)

    if 'images' not in request.files:
        return jsonify({"error": "No files part in the request"}), 400

    images = request.files.getlist('images')
    dest_folder = os.path.join("datasets", dataset_class)

    print("images: ", images)
    print("dest_folder: ", dest_folder)


    os.makedirs(dest_folder, exist_ok=True)

    dataset_upload_ops.process_image_uploading(images, dest_folder)
    img_count = dataset_upload_ops.count_images(dest_folder)
    print("img_count: ", img_count)

    dataset_db_ops.update_dataset_class_data(img_count, class_id)

    return 'Image Uploaded Successfull', 200




@ws_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    print(f"Client connected: {websocket.client}")
    try:
        while True:
            message = await websocket.receive_text()
            print(f"Received message: {message}")
    except WebSocketDisconnect:
        print(f"Client disconnected: {websocket.client}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        clients.remove(websocket)
        print(f"Client removed: {websocket.client}")



def train_model_async(data):
    model_version = data.get('version')
    print("model_version:", model_version)

    train_acc, val_acc, train_loss, val_loss = train_new_model(DATASET_FOLDER, model_version)

    data = {
        "version": f'ClamScanner_v{model_version}',
        "train_accuracy": train_acc,
        "validation_accuracy": val_acc,
        "train_loss": train_loss,
        "validation_loss": val_loss
    }

    return 'Trained Successfully'


@app.post("/train/model")
def train():
    data = request.get_json()
    threading.Thread(target=train_model_async, args=(data,)).start()
    return jsonify({"status": "Training started"}), 200



@app.post("/image/scan")
def scan():
    try:
        file = predict.load_validate_image_file(request, jsonify)

        filename = secure_filename(file.filename)
        file_path = os.path.join('./', filename)
        file.save(file_path)
        
        mollusk_classified_result = predict.mollusk_predict(file_path)
        os.remove(file_path)
        
        return jsonify({"mollusk_classified_result": mollusk_classified_result}), 200

    except Exception as e:
        print("Error during image processing:", e)
        return jsonify({"error": "Image processing failed"}), 500
    



@app.post("/message/chatbot")
def chat():
    try:
        data = request.json
        user_input = data.get("message")

        if user_input:
            response = chatbot.get_responses(user_input)
            return jsonify({"response": response}), 200

    except Exception as e:
        print("Error during chat process:", e)
        error_response = "An error occurred while processing your request. Please try again later or contact support for assistance."
        return jsonify({"error_occured": error_response}), 500



def run_flask():
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)

def run_fastapi():
    uvicorn.run(ws_app, port=8000)


if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask)
    fastapi_thread = threading.Thread(target=run_fastapi)

    flask_thread.start()
    fastapi_thread.start()

    flask_thread.join()
    fastapi_thread.join()
