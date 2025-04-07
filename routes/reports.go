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
	router.HandleFunc("POST /insert/logs", ParseHTTPHandler(reportsHandler.InsertScanLogsHandler))

	router.HandleFunc("GET /fetch/reports", ParseHTTPHandler(reportsHandler.FetchAllReportsHandler))
	router.HandleFunc("GET /fetch/map/reports/{month}/{mollusk}/{status}", ParseHTTPHandler(reportsHandler.FetchMapReportsHandler))

	router.HandleFunc("GET /generate/reports", ParseHTTPHandler(reportsHandler.GenerateReportsHandler))

	
	router.HandleFunc("GET /fetch/scan/logs", adminAuth(ParseHTTPHandler(reportsHandler.FetchScanLogsHandler)))
	router.HandleFunc("GET /fetch/reports/city", adminAuth(ParseHTTPHandler(reportsHandler.FetchReportByCityHandler)))
	router.HandleFunc("GET /fetch/reports/province", adminAuth(ParseHTTPHandler(reportsHandler.FetchReportByProvinceHandler)))
	router.HandleFunc("GET /fetch/reports/mollusk", adminAuth(ParseHTTPHandler(reportsHandler.FetchReportPerMollusk)))
	router.HandleFunc("GET /fetch/reports/year", adminAuth(ParseHTTPHandler(reportsHandler.FetchReportPerYearHandler)))
	router.HandleFunc("GET /fetch/reports/year/resolved", adminAuth(ParseHTTPHandler(reportsHandler.FetchResolvedReportPerYearHandler)))

	router.HandleFunc("PUT /update/report/status/{report_id}", ParseHTTPHandler(reportsHandler.UpdateReportStatusHandler))
	router.HandleFunc("DELETE /delete/reports/{report_id}/{molluskName}/{province}/{city}", adminAuth(ParseHTTPHandler(reportsHandler.DeleteReportHandler)))
	
}
