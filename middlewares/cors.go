package middlewares

import (
	"net/http"

	"github.com/rs/cors"
)

func AllowCors(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		c := cors.New(cors.Options{
			AllowedOrigins: []string{"http://localhost:1500", "https://clamscanner.vercel.app"},
			AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
			AllowedHeaders: []string{"*"},
			AllowCredentials: true,
		})

		next = c.Handler(next)
		next.ServeHTTP(w, r)

	})

}
