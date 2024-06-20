package routes

import (
	"net/http"

	"github.com/johnkristanf/clamscanner/handlers"
)

func DatasetsRoutes(router *http.ServeMux, datasetsHandler *handlers.DatasetsHandlers) {

	adminAuth := datasetsHandler.JWT_METHOD.AdminAuthenticateMiddleware

	router.HandleFunc("POST /add/dataset/class", adminAuth(ParseHTTPHandler(datasetsHandler.AddDatasetClassHandler)))
	router.HandleFunc("POST /edit/dataset/class", adminAuth(ParseHTTPHandler(datasetsHandler.EditDatasetClassHandler)))

	// router.HandleFunc("POST /upload/images", adminAuth(ParseHTTPHandler(datasetsHandler.UploadImageDatasetHandler)))
	router.HandleFunc("DELETE /delete/class/{class_id}/{className}", adminAuth(ParseHTTPHandler(datasetsHandler.DeleteDatasetClassHandler)))


	router.HandleFunc("GET /fetch/dataset/class", adminAuth(ParseHTTPHandler(datasetsHandler.FetchDatasetClassHandler)))
	router.HandleFunc("GET /fetch/images/{classFolderName}", adminAuth(ParseHTTPHandler(datasetsHandler.FetchDatasetClassImagesHandler)))

}
