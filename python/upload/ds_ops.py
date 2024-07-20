import os
import shutil


class DatasetOperations:
    def add_new_dataset_class(folder_path: str):
        try:
            os.makedirs(folder_path, exist_ok=True)
        except Exception as e:
            print(f"Error creating directory {folder_path}: {e}")


    def delete_dataset_class(folder_path: str):
        try:
            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)
        except Exception as e:
            print(f"Error occurred while removing folder '{folder_path}': {str(e)}")