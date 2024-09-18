import os
import redis
import time
import json

from urllib.parse import urlparse
# from dotenv import load_dotenv

# load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

class RedisCachingMethods:

    def get_pool(self):
        try:
            redis_url = os.getenv("REDIS_URI")
            parsed_url = urlparse(redis_url)

            print(f"Redis URI: {redis_url}")
            print(f"Redis parsed_url URI: {parsed_url}")
            
            host = parsed_url.hostname
            port = parsed_url.port

            print(f"Redis host: {host}")
            print(f"Redis port: {port}")

            return redis.ConnectionPool(
                host=host, 
                port=port, 
                db=0, 
                max_connections=10,  
                decode_responses=True 
            )

        except redis.ConnectionError:
            print("Error During Creating Redis Pool") 

    def get_redis_connection(self, retries=5):
        attempt = 0

        while attempt < retries:
            try:
                redis_client = redis.StrictRedis(connection_pool=self.get_pool())
                redis_client.ping()

                print("Connected to Redis")
                return redis_client
            
            except redis.ConnectionError:
                attempt += 1
                wait_time = 2 ** attempt
                print(f"Connection failed. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)

        raise redis.ConnectionError("Max retries reached. Unable to connect to Redis.")
    

    def SET(self, key, value):
        try:
            value = json.dumps(value)
            redis_client = self.get_redis_connection()

            redis_client.set(key, value)
            print(f"Cached set value under key: {key}")

        except redis.RedisError as e:
            print(f"Failed to set cache: {e}")


    def GET(self, key):
        try:
            redis_client = self.get_redis_connection()
            cached_value = redis_client.get(key)

            if cached_value:
                value = json.loads(cached_value)
                return value
            else:
                print(f"Cache miss for key: {key}")
                return None
            
        except redis.RedisError as e:
            print(f"Failed to get cache: {e}")
            return None
        

    def APPEND_TO_CACHED_URLS(self, key, new_data):
        cached_value = self.GET(key)
        if cached_value is None:
            cached_value = []
        
        cached_value.append(new_data)
        self.SET(key, cached_value)


    def COUNT_TOTAL_DATASET(self):
        redis_client = self.get_redis_connection()
        total_images = 0

        dataset_keys = redis_client.keys('datasets/*/image_urls')

        for key in dataset_keys:
            cached_data = redis_client.get(key)

            if cached_data:
                images_data = json.loads(cached_data)
                total_images += len(images_data)

        return total_images
        

    def DELETE(self, key):
        try:
            redis_client = self.get_redis_connection()
            redis_client.delete(key)

            print(f"Cache deleted for key: {key}")
        except redis.RedisError as e:
            print(f"Failed to delete cache: {e}")


