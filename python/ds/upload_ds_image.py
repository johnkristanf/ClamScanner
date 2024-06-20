import os
from database.db import db_conn
from werkzeug.utils import secure_filename

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from werkzeug.datastructures import FileStorage
from flask import Flask

def DB_DATASETS(app: Flask):

    db = db_conn(app)

    class Datasets(db.Model):
        __tablename__ = 'datasets' 

        id = Column(Integer, primary_key=True, autoincrement=True)
        name = Column(String, nullable=False)
        scientific_name = Column(String, nullable=False)
        description = Column(Text, nullable=False)
        life_cycle = Column(String, nullable=False)
        status = Column(String, nullable=False)
        count = Column(Integer, nullable=False)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

        def __repr__(self):
            return f"<Datasets(name={self.name}, scientific_name={self.scientific_name}, count={self.count})>"
        

    def update_dataset_class_data(imgcount, classID):
        try:
            dataset = Datasets.query.filter_by(id=classID).first()
            if not dataset:
                raise ValueError(f"Dataset with id {classID} not found")

            dataset.count = imgcount
            db.session.commit()
            return None  # No error occurred
        except Exception as e:
            db.session.rollback()
            return str(e)
        

    return update_dataset_class_data 
        


def count_images(folder_path):
    count = 0

    files = os.listdir(folder_path)

    for file_name in files:
        file_path = os.path.join(folder_path, file_name)
        if os.path.isfile(file_path) and is_image(file_name):
            count += 1

    return count

def is_image(file_name):
    image_extensions = ['.jpg', '.jpeg', '.png'] 
    ext = os.path.splitext(file_name)[1].lower()
    return ext in image_extensions


def process_image_uploading(images: list[FileStorage], dest_folder: str):
    for file in images:
        if file.filename == '':
            continue

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(dest_folder, filename)
            file.save(file_path)

    
    
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS