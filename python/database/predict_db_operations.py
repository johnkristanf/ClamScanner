from database.db_connect import get_connection
from datetime import datetime

import psycopg2


class PredictDatabaseOperations:
    def __init__(self):
        self.connection_pool = get_connection() 

    def load_dataset_class_names(self):   
        conn = None 
        cur = None

        try:
            conn = self.connection_pool.getconn() 
            cur = conn.cursor()

            query = 'SELECT name FROM datasets ORDER BY created_at ASC'
            cur.execute(query)
            
            result = cur.fetchall()
            class_names = [row[0] for row in result]

            conn.commit()
            return class_names
        
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error: {error}")
            if conn:
                conn.rollback()  
            return 0
        
        finally:
            if cur: 
                cur.close()
            if conn:
                self.connection_pool.putconn(conn)