package middlewares

import (
	"net/http"
)

type Middleware func(http.Handler) http.Handler

func Use(stack ...Middleware) Middleware {

	return func(next http.Handler) http.Handler {
		for i := len(stack) - 1; i >= 0; i-- {
			middleware := stack[i]
			next = middleware(next)
		}

		return next
	}
}
