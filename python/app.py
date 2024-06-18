import os
import predict

from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify

from flask_cors import CORS
from ws_client import clients
from fastapi.middleware.cors import CORSMiddleware

from train.process_train import train_new_model
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

import threading
import uvicorn


ws_app = FastAPI()
app = Flask(__name__)
CORS(app)

ws_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)


DATASET_FOLDER = '../datasets'


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


@app.post("/image/scan")
def scan():
    try:
        if 'captured_image_file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['captured_image_file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join('./', filename)
        file.save(file_path)

        print("file_path", file_path)
        
        mollusk_classified_result = predict.mollusk_predict(file_path)
        os.remove(file_path)
        
        return jsonify({"mollusk_classified_result": mollusk_classified_result})

    except Exception as e:
        print("Error during image processing:", e)
        return jsonify({"error": "Image processing failed"}), 500


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

    return 'AYDULLL PA PIKSHURR'


@app.post("/train/model")
def train():
    data = request.get_json()
    threading.Thread(target=train_model_async, args=(data,)).start()
    return jsonify({"status": "Training started"})


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
