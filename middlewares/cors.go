package middlewares

import (
	"net/http"

	"github.com/rs/cors"
)

func AllowCors(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		c := cors.New(cors.Options{
			AllowedOrigins: []string{"http://localhost:1500", "exp://192.168.43.252:8081", "http://localhost:8081"},
			AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
			AllowedHeaders: []string{"*"},
			AllowCredentials: true,
		})

		next = c.Handler(next)
		next.ServeHTTP(w, r)

	})

}
