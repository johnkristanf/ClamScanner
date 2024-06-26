package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-redis/redis/v8"
	"github.com/johnkristanf/clamscanner/mock_methods"
	"github.com/johnkristanf/clamscanner/types"
	"github.com/stretchr/testify/mock"
)

var benchmarkReportsHandlers = setupReportsHandlers()

var mockReportsDB = benchmarkReportsHandlers.DB_METHOD.(*MockReportsDBMethod)
var mockRedis = benchmarkReportsHandlers.REDIS_METHOD.(*mock_methods.MockRedisMethod)
var mockReportsJSON = benchmarkReportsHandlers.JSON_METHOD.(*mock_methods.MockJSONMethod)

var reportKeys = [4]string{"reports", "reports_city", "reports_province", "reports_per_mollusk"}


func BenchmarkInsertReportHandler(b *testing.B) {

	mockReportsDB.On("InsertReport", mock.Anything).Return(4, nil)
	mockRedis.On("DELETEBYKEY", reportKeys, mock.Anything).Return(nil)
	mockReportsJSON.On("JsonEncode", mock.AnythingOfType("*httptest.ResponseRecorder"), http.StatusOK, "Reported Successfully").Return(nil)

	for i := 0; i < b.N; i++{

		report := &types.Reported_Cases{
			Longitude: 2.2,
			Latitude: 3.0,
			City: "panabo",
			Province: "del norte",
			District: "gredu",
			MolluskType: "scaly clam",
			UserID: 5,
		}

		body, _ := json.Marshal(report)

		req := httptest.NewRequest("POST", "/insert/report", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		benchmarkReportsHandlers.InsertReportHandler(rr, req)
	}

	mockReportsDB.AssertExpectations(b)
	mockRedis.AssertExpectations(b)
	mockReportsJSON.AssertExpectations(b)

}


func BenchmarkFetchAllReportsHandler(b *testing.B) {

	fetchReports := []*types.Fetch_Cases{
		{
			Longitude: 2.2,
			Latitude: 3.0,
			City: "panabo",
			Province: "del norte",
			District: "gredu",
			ReportedAt: "May 10, 2024",
			MolluskType: "scaly clam",
			Status: "Endangered",
			UserID: 6,

			ReporterName: "John Kristan",
			ReporterAddress: "Barangay Gredu",
		},

		{
			Longitude: 2.2,
			Latitude: 3.0,
			City: "panabo",
			Province: "del norte",
			District: "gredu",
			ReportedAt: "May 10, 2024",
			MolluskType: "scaly clam",
			Status: "Endangered",
			UserID: 6,

			ReporterName: "John Doe",
			ReporterAddress: "Barangay New Pandan",
		},
	}

	mockReportsDB.On("FetchReportedCases").Return(fetchReports, nil)
	mockRedis.On("GET",  mock.Anything,  mock.Anything, mock.Anything).Return(redis.Nil)
	mockRedis.On("SET",  mock.Anything,  mock.Anything, mock.Anything).Return(nil)
	mockReportsJSON.On("JsonEncode", mock.Anything, http.StatusOK, fetchReports).Return(nil)

	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("GET", "/fetch/reports", nil)
		rr := httptest.NewRecorder()

		benchmarkReportsHandlers.FetchAllReportsHandler(rr, req)
	}

	mockReportsDB.AssertExpectations(b)
	mockRedis.AssertExpectations(b)
	mockReportsJSON.AssertExpectations(b)

}