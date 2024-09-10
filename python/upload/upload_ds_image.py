import os
import shutil

from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

from database.db_connect import get_connection
import psycopg2 



class DatasetDatabaseOperations:
    def __init__(self) :
        self.connection_pool = get_connection()
        
    def update_dataset_class_data(self, imgcount, classID):
        conn = None
        cur = None

        try:
            conn = self.connection_pool.getconn()
            cur = conn.cursor()
            
            update_query = """
                UPDATE datasets
                SET count = %s
                WHERE id = %s;
            """
            
            cur.execute(update_query, (imgcount, classID))
            conn.commit()

            updated_rows = cur.rowcount
            print(f"{updated_rows} row(s) updated.")
        
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error: {error}")
            if conn:
                conn.rollback()
            return None
        
        finally:
            if cur: 
                cur.close()
                
            if conn:
                self.connection_pool.putconn(conn)
                



class DatasetImageUploadMethod:
    def __init__(self):
        self.extensions = ['.jpg', '.jpeg', '.png']

    def count_images(self, folder_path):
        count = 0
        files = os.listdir(folder_path)
        for file_name in files:
            file_path = os.path.join(folder_path, file_name)
            print(f"Saving file count to: {file_path}")

            if os.path.isfile(file_path) and self.is_image(file_name):
                count += 1
        return count
    

    def is_image(self, file_name):
        ext = os.path.splitext(file_name)[1].lower()
        return ext in self.extensions
    

    def process_image_uploading(self, images: list[FileStorage], dest_folder: str):
        for file in images:
            if file.filename == '':
                continue
            
            if file and self.is_image(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(dest_folder, filename)
                file.save(file_path)
                

    def allowed_file(self, filename):
        return '.' in filename and filename.split('.', 1)[1].lower() in self.extensions
    

    def add_new_dataset_class(self, folder_path: str):
        try:
            os.makedirs(folder_path, exist_ok=True)
        except Exception as e:
            print(f"Error creating directory {folder_path}: {e}")


    def delete_dataset_class(self, folder_path: str):
        try:
            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)
        except Exception as e:
            print(f"Error occurred while removing folder '{folder_path}': {str(e)}")
