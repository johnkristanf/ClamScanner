import os
from psycopg2 import pool

def get_connection():
    dbname     = os.getenv('DB_NAME')
    user       = os.getenv('DB_USER')
    password   = os.getenv('DB_PASSWORD')
    host       = os.getenv('DB_HOST')   
    port       = os.getenv('DB_PORT')    

    conn = pool.SimpleConnectionPool(
        1, 10,
        f'dbname={dbname} user={user} password={password} host={host} port={port}'
    )
    return conn
