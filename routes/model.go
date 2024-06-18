package routes

import (
	"net/http"
	"github.com/johnkristanf/clamscanner/handlers"
)

func ModelRoutes(router *http.ServeMux, modelHandler *handlers.ModelHandlers) {

	// adminAuth := modelHandler.JWT_METHOD.AdminAuthenticateMiddleware

	// router.HandleFunc("POST /train/model", adminAuth(ParseHTTPHandler(modelHandler.TrainModelHandler)))
	// router.HandleFunc("POST /scan", ParseHTTPHandler(modelHandler.ScanHandler))

	router.HandleFunc("GET /fetch/model", ParseHTTPHandler(modelHandler.FetchModelsHandler))
	router.HandleFunc("GET /fetch/mollusk/{mollusk_name}", ParseHTTPHandler(modelHandler.FetchIdentifiedMolluskHandler))


}
