from database.db_connect import get_connection
import psycopg2

class ChatBotDatabaseOperations:
    def __init__(self):
        self.connection_pool = get_connection() 


    def get_reports_per_provinces(self, province):
        conn = None 
        cur = None

        try:
            conn = self.connection_pool.getconn() 
            cur = conn.cursor()

            query = 'SELECT COUNT(id) FROM reported_cases WHERE province=%s'
            cur.execute(query, (province,))
            conn.commit()

            rows = cur.fetchone()
            return rows[0]
        
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
                

    def get_reports_per_city(self, city):
        try:
            conn = self.connection_pool.getconn()  
            cur = conn.cursor()

            query = 'SELECT COUNT(id) FROM reported_cases WHERE city=%s'
            cur.execute(query, (city,))
            conn.commit()

            rows = cur.fetchone()
            return rows[0]
        
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
                
        


    def get_reports_per_mollusk_type(self, mollusk_type):
        try:
            conn = self.connection_pool.getconn()  
            cur = conn.cursor()

            query = 'SELECT COUNT(id) FROM reported_cases WHERE mollusk_type=%s'
            cur.execute(query, (mollusk_type,))
            conn.commit()

            rows = cur.fetchone()
            return rows[0]
        
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
                
        


    def get_all_reports_location(self, report_type):
        try:
            conn = self.connection_pool.getconn()  
            cur = conn.cursor()

            query = f"SELECT {report_type}, COUNT(id) as reports FROM reported_cases GROUP BY {report_type}"
            cur.execute(query)
            conn.commit()

            rows = cur.fetchall()
            formatted_results = "\n".join([f" • {row[0]} - {row[1]} reports" for row in rows])
            return formatted_results
        
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
                
        


    def get_average_reports_location(self, report_type):
        try:
            conn = self.connection_pool.getconn()  
            cur = conn.cursor()

            query = f"""
                WITH counts AS (
                    SELECT {report_type}, COUNT(id) AS count_per_group
                    FROM reported_cases
                    GROUP BY {report_type}
                ),
                
                total AS (
                    SELECT COUNT(id) AS total_count
                    FROM reported_cases
                )

                SELECT 
                    {report_type},
                    ROUND(count_per_group::numeric / total_count, 2) AS average_reports
                FROM 
                    counts, 
                    total;
            """
            cur.execute(query)
            conn.commit()

            rows = cur.fetchall()
            formatted_results = "\n".join([f" • {row[0]} - {row[1]} reports" for row in rows])
            return formatted_results
        
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
                
        


    def get_reports_mollusk_type_locations(self, mollusk_type, location_type, location):
        try:
            conn = self.connection_pool.getconn()  
            cur = conn.cursor()

            query = f"""
                SELECT COUNT(id) 
                FROM reported_cases 
                WHERE LOWER(mollusk_type) = LOWER(%s) 
                AND LOWER({location_type}) = LOWER(%s)
            """
            cur.execute(query, (mollusk_type, location))
            conn.commit()

            rows = cur.fetchone()
            return rows[0]
        
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
                
        
