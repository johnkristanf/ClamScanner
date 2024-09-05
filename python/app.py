import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
import threading
import uvicorn

from ws_client import clients

from upload.upload_ds_image import DatasetDatabaseOperations, DatasetImageUploadMethod
from ML.chat import ChatBotService
from ML.predict import ClamPrediction
from train.process_train import train_new_model

app = FastAPI()

# comment this out cause the nginx configuration 
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
DATASET_FOLDER = os.path.abspath('datasets')

chatbot = ChatBotService()
dataset_db_ops = DatasetDatabaseOperations()
dataset_upload_ops = DatasetImageUploadMethod()
predict = ClamPrediction()



@app.post("/add/dataset/class")
async def add_dataset(data: dict):
    folder_path = data.get('folder_path')
    dataset_upload_ops.add_new_dataset_class(folder_path)
    return JSONResponse(content={"success": "Dataset Class Added!"}, status_code=200)



@app.post("/delete/dataset/class")
async def delete_dataset(data: dict):
    folder_path = data.get('folder_path')
    dataset_upload_ops.delete_dataset_class(folder_path)
    return JSONResponse(content={"success": "Dataset Class Deleted!"}, status_code=200)



@app.post("/upload/dataset/images")
async def upload_images(
    datasetClass: str = Form(...), 
    class_id: str = Form(...), 
    images: list[UploadFile] = File(...)
):
    dest_folder = os.path.join("datasets", datasetClass)
    os.makedirs(dest_folder, exist_ok=True)

    for file in images:
        filename = secure_filename(file.filename)
        file_path = os.path.join(dest_folder, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
    
    img_count = dataset_upload_ops.count_images(dest_folder)
    dataset_db_ops.update_dataset_class_data(img_count, class_id)
    
    return JSONResponse(content={"message": "Image Uploaded Successfully"}, status_code=200)


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
        train_acc, val_acc, train_loss, val_loss = train_new_model(DATASET_FOLDER, model_version)
        return {
            "version": f'ClamScanner_v{model_version}',
            "train_accuracy": train_acc,
            "validation_accuracy": val_acc,
            "train_loss": train_loss,
            "validation_loss": val_loss
        }

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
    print("Fast API Server HTTPS Listens to Port 5000")
    uvicorn.run(app, port=5000, host='0.0.0.0')
