from flask_sqlalchemy import SQLAlchemy
from flask import Flask


def db_conn(app: Flask):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:johntorremocha@localhost/clamscanner'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)

    return db