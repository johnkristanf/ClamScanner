import psycopg2

class ChatBotDatabaseOperations:
    def __init__(self):
        self.dbname     = "clamscanner"
        self.user       = "postgres"
        self.password   = "johntorremocha"


    def get_connection(self):
        conn = psycopg2.connect(f'dbname={self.dbname} user={self.user} password={self.password}')
        return conn
    
    def get_reports_per_provinces(self, province):
        conn = self.get_connection()
        cur = conn.cursor()

        query = 'SELECT COUNT(id) FROM reported_cases WHERE province=%s'
        cur.execute(query, (province,))

        rows = cur.fetchone() 
        cur.close()
        conn.close()

        return rows[0] 
    
    def get_reports_per_city(self, city):
        conn = self.get_connection()
        cur = conn.cursor()

        query = 'SELECT COUNT(id) FROM reported_cases WHERE city=%s'
        cur.execute(query, (city,))

        rows = cur.fetchone() 
        cur.close()
        conn.close()
        
        return rows[0] 
    
    def get_reports_per_mollusk_type(self, mollusk_type):
        conn = self.get_connection()
        cur = conn.cursor()

        query = 'SELECT COUNT(id) FROM reported_cases WHERE mollusk_type=%s'
        cur.execute(query, (mollusk_type,))

        rows = cur.fetchone() 
        cur.close()
        conn.close()
        
        return rows[0] 
    
    
    def get_all_reports_location(self, report_type):
        conn = self.get_connection()
        cur = conn.cursor()

        query = f"SELECT {report_type}, COUNT(id) as reports FROM reported_cases GROUP BY {report_type}"
        cur.execute(query)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        formatted_results = "\n".join([f" • {row[0]} - {row[1]} reports" for row in rows])

        return formatted_results
    

    def get_average_reports_location(self, report_type):
        conn = self.get_connection()
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

        rows = cur.fetchall()
        
        cur.close()
        conn.close()

        formatted_results = "\n".join([f" • {row[0]} - {row[1]} reports" for row in rows])

        return formatted_results

    def get_reports_mollusk_type_locations(self, mollusk_type, location_type, location):
        conn = self.get_connection()
        cur = conn.cursor()

        query = f"""
            SELECT COUNT(id) 
            FROM reported_cases 
            WHERE LOWER(mollusk_type) = LOWER(%s) 
            AND LOWER({location_type}) = LOWER(%s)
        """
        
        cur.execute(query, (mollusk_type, location))

        rows = cur.fetchone() 
        cur.close()
        conn.close()
        
        return rows[0]
    
 
