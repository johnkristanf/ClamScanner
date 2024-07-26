import os
from psycopg2 import pool


def get_connection():
    dbname     = os.getenv('DB_NAME')
    user       = os.getenv('DB_USER')
    password   = os.getenv('DB_PASSWORD')
     
    conn = pool.SimpleConnectionPool(
        1, 10,
        f'dbname={dbname} user={user} password={password}'
    )
    return conn