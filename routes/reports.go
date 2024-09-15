package routes

import (
	"net/http"

	"github.com/johnkristanf/clamscanner/handlers"
)

func ReportsRoutes(router *http.ServeMux, reportsHandler *handlers.ReportHandler) {

	adminAuth := reportsHandler.JWT_METHOD.AdminAuthenticateMiddleware
	// mobileAuth := reportsHandler.JWT_METHOD.MobileAuthenticateMiddleware

	router.HandleFunc("GET /ws/conn", ParseHTTPHandler(reportsHandler.WebsocketConnHandler))

	router.HandleFunc("POST /insert/report", ParseHTTPHandler(reportsHandler.InsertReportHandler))

	router.HandleFunc("GET /fetch/reports", ParseHTTPHandler(reportsHandler.FetchAllReportsHandler))
	router.HandleFunc("GET /fetch/map/reports/{month}/{mollusk}/{status}", ParseHTTPHandler(reportsHandler.FetchMapReportsHandler))
	
	router.HandleFunc("GET /fetch/reports/city", adminAuth(ParseHTTPHandler(reportsHandler.FetchYearlyReportByCityHandler)))
	router.HandleFunc("GET /fetch/reports/province", adminAuth(ParseHTTPHandler(reportsHandler.FetchYearlyReportByProvinceHandler)))
	router.HandleFunc("GET /fetch/reports/mollusk", adminAuth(ParseHTTPHandler(reportsHandler.FetchReportPerMollusk)))

	router.HandleFunc("PUT /update/report/status/{report_id}", ParseHTTPHandler(reportsHandler.UpdateReportStatusHandler))
	router.HandleFunc("DELETE /delete/reports/{report_id}", adminAuth(ParseHTTPHandler(reportsHandler.DeleteReportHandler)))
	
}
