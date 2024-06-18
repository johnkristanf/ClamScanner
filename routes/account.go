package routes

import (
	"net/http"

	"github.com/johnkristanf/clamscanner/handlers"
)

func AccountRoutes(router *http.ServeMux, accountHandler *handlers.AccountHandler) {

	adminAuth := accountHandler.JWT_METHOD.AdminAuthenticateMiddleware

	router.HandleFunc("POST /auth/signup", ParseHTTPHandler(accountHandler.SignupHandler))
	router.HandleFunc("POST /auth/login", ParseHTTPHandler(accountHandler.LoginHandler))
	router.HandleFunc("POST /admin/login", ParseHTTPHandler(accountHandler.AdminLoginHandler))

	router.HandleFunc("GET /personnel/accounts", adminAuth(ParseHTTPHandler(accountHandler.PersonnelAccountsHandler)))
	router.HandleFunc("GET /admin/data", adminAuth(ParseHTTPHandler(accountHandler.FetchAdminDataHandler)))

	router.HandleFunc("DELETE /delete/account/{account_id}", adminAuth(ParseHTTPHandler(accountHandler.DeleteAccountHandler)))

	router.HandleFunc("POST /signout", ParseHTTPHandler(accountHandler.SignOutHandler))

}
