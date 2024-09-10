from database.db_connect import get_connection
from datetime import datetime

import psycopg2


class TrainDatabaseOperations:
    def __init__(self):
        self.connection_pool = get_connection() 

    def insert_train_metrics(self, metrics):

        try:
            conn = None
            cur = None
            conn = self.connection_pool.getconn()

            query = """
                INSERT INTO models(version, train_accuracy, val_accuracy, train_loss, val_loss, trained_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """

            values = (
                metrics.get('version'),            
                metrics.get('train_acc'),     
                metrics.get('val_acc'),      
                metrics.get('train_loss'),        
                metrics.get('val_loss'), 
                datetime.now()         
            )

            cur = conn.cursor()
            cur.execute(query, values)
            conn.commit()

            return "Metrics Inserted Successfully"

        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error: {error}")
            if conn:
                conn.rollback()
            return "Error inserting metrics"

        finally:
            if cur:
                cur.close()
            if conn:
                self.connection_pool.putconn(conn)
