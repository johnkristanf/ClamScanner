package routes

import (
	"log"
	"net/http"
)


type httpHandler func(w http.ResponseWriter, r *http.Request) error

func ParseHTTPHandler(handler httpHandler) http.HandlerFunc {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if err := handler(w, r); err != nil {
			log.Println("HANDLER ERROR", err)
			// w.WriteHeader(http.StatusInternalServerError)
		}

	})
}
