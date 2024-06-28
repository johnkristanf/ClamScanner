package middlewares

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

type Redis struct{
	client 		*redis.Client
	clientMux 	sync.RWMutex
	redisURL  	string
	ctx			context.Context
	cancelFunc  context.CancelFunc
}

type REDIS_METHOD interface{
	SET(interface{}, string, *http.Request) error
	GET(interface{}, string, *http.Request) error
	DELETE(string, *http.Request) error
	DELETEBYKEY([5]string, *http.Request) error
	
}

func REDIS(redisURL string) (*Redis, error){

	ctx, cancelFunc := context.WithCancel(context.Background())

	redisInstance := &Redis{
		redisURL: redisURL,
		ctx: ctx,
		cancelFunc: cancelFunc,
	}
	
	err := redisInstance.connect()
	if err != nil{
		cancelFunc() 
		return nil, err
	}

	go redisInstance.reconnectHandler()

	return redisInstance, nil
	
}

func (r *Redis) connect() error {
	var client *redis.Client
	var ctx = context.Background()

	u, err := url.Parse(r.redisURL)
	if err != nil{
		return err
	}

	host := u.Hostname()
	port := u.Port()

	// config := &tls.Config{
	// 	InsecureSkipVerify: true,
	// 	ServerName: host,
	// }

	connectToRedis := func () (*redis.Client, error)  {
		return redis.NewClient(&redis.Options{
			Addr:      fmt.Sprintf("%s:%s", host, port),
			DB:        0,
			DialTimeout: 60 * time.Second,  
		    ReadTimeout: 60 * time.Second,
			MaxRetries: 5,
			MinRetryBackoff: 512,
			MaxRetryBackoff: 1000,

			MinIdleConns: 4,
			MaxConnAge: 30 * time.Minute,

			// TLSConfig: config,
			
		}), nil
	}

	client, err = connectToRedis()
	if err != nil{
		return err
	}

	_, err = client.Ping(ctx).Result()
	if err != nil{
		return err
	}

	r.clientMux.Lock()
	r.client = client
	r.clientMux.Unlock()

	fmt.Println("Connected to Redis Server Successfully")
	return nil

}

func (r *Redis) reconnectHandler() {
	for {
		select {
		case <-r.ctx.Done():
			return
		default:
			r.clientMux.RLock()
			client := r.client
			r.clientMux.RUnlock()

			_, err := client.Ping(r.ctx).Result()
			if err != nil {
				fmt.Println("Redis connection lost. Attempting to reconnect...")
				for {
					err = r.connect()
					if err == nil {
						break
					}
					fmt.Printf("Reconnection failed: %v. Retrying...\n", err)
					time.Sleep(2 * time.Second)
				}
			}
			time.Sleep(1 * time.Second)
		}
	}
}


func (r *Redis) getClient() *redis.Client {
	r.clientMux.RLock()
	defer r.clientMux.RUnlock()
	return r.client
}

func (r *Redis) SET(cachedData interface{}, cacheKey string, req *http.Request) error {

	if r == nil {
        return fmt.Errorf("Redis instance is nil")
    }

	ctx, cancel := context.WithTimeout(req.Context(), 200*time.Millisecond)
	defer cancel()

	jsonData, err := json.Marshal(cachedData)
	if err != nil {
		return err
	}

	client := r.getClient()
	if err := client.Set(ctx, cacheKey, jsonData, 30*time.Minute).Err(); err != nil {
		return err
	}

	return nil
}


func (r *Redis) GET(dest interface{}, cacheKey string, req *http.Request) error {

	if r == nil {
        return fmt.Errorf("Redis instance is nil")
    }

    ctx, cancel := context.WithTimeout(req.Context(), 300*time.Millisecond)
    defer cancel()

    client := r.getClient()
    cachedData, err := client.Get(ctx, cacheKey).Result()
    if err != nil {
        return err
    }

    if err := json.Unmarshal([]byte(cachedData), dest); err != nil {
        return err
    }

    return nil
}

func (r *Redis) DELETE(cacheKey string, req *http.Request) error {

	if r == nil {
        return fmt.Errorf("Redis instance is nil")
    }

	ctx, cancel := context.WithTimeout(req.Context(), 100*time.Millisecond)
	defer cancel()

	client := r.getClient()
	_, err := client.Del(ctx, cacheKey).Result()
	if err != nil {
		return err
	}

	return nil

}

func (r *Redis) DELETEBYKEY(cacheKey [5]string, req *http.Request) error {

	if r == nil {
        return fmt.Errorf("Redis instance is nil")
    }

	ctx, cancel := context.WithTimeout(req.Context(), 100 * time.Millisecond)
	defer cancel()

	for _, key := range cacheKey{

		client := r.getClient()
		_, err := client.Del(ctx, key).Result()
		if err != nil {
			return err
		}

	}

	

	return nil

}