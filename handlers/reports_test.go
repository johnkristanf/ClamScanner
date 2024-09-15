package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/johnkristanf/clamscanner/mock_methods"
	"github.com/johnkristanf/clamscanner/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockReportsDBMethod struct {
	mock.Mock
}

var (
	ws *websocket.Conn 
	err error

)

var reportsHandler = setupReportsHandlers()

func setupReportsHandlers() *ReportHandler {
	return &ReportHandler{
		DB_METHOD: new(MockReportsDBMethod),
		JSON_METHOD: new(mock_methods.MockJSONMethod),
		JWT_METHOD: new(mock_methods.MockJWTMethod),
		REDIS_METHOD: new(mock_methods.MockRedisMethod),
	}
}


func (m *MockReportsDBMethod) InsertReport(reportCases *types.Reported_Cases) (int64, error) {
	args := m.Called(reportCases)
	return int64(args.Int(0)), args.Error(1)
}


func (m *MockReportsDBMethod) FetchReportedCases() ([]*types.Fetch_Cases, error) {
	args := m.Called()
	return args.Get(0).([]*types.Fetch_Cases), args.Error(1)
}

func (m *MockReportsDBMethod) FetchMapReportedCases(month string, mollusk string, status string) ([]*types.Fetch_Cases, error) {
	args := m.Called(month, mollusk, status)
	return args.Get(0).([]*types.Fetch_Cases), args.Error(1)
}

func (m *MockReportsDBMethod) FetchPerCityReports() ([]*types.YearlyReportsPerCity, error) {
	args := m.Called()
	return args.Get(0).([]*types.YearlyReportsPerCity), args.Error(1)
}


func (m *MockReportsDBMethod) FetchPerProvinceReports() ([]*types.YearlyReportsPerProvince, error) {
	args := m.Called()
	return args.Get(0).([]*types.YearlyReportsPerProvince), args.Error(1)
}


func (m *MockReportsDBMethod) FetchReportsPerMollusk() ([]*types.ReportsPerMollusk, error){
	args := m.Called()
	return args.Get(0).([]*types.ReportsPerMollusk), args.Error(1)
}


func (m *MockReportsDBMethod) DeleteReportCases(report_id int64) error {
	args := m.Called(report_id)
	return args.Error(0)
}


func (m *MockReportsDBMethod) UpdateReportStatus(report_id int64) error {
	args := m.Called(report_id)
	return args.Error(0)
}



func TestWSConnectWithRetry(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
		err := reportsHandler.WebsocketConnHandler(w, r)
		assert.NoError(t, err)

	}))

	defer mockServer.Close()
	url := "ws" + mockServer.URL[len("http"):]

	wsURL := url + "/ws"
	ws, _, err = websocket.DefaultDialer.Dial(wsURL, nil)
	assert.NoError(t, err)
	assert.NotNil(t, ws, "WebSocket connection should be established")

	defer ws.Close()

}


func TestSendReportID(t *testing.T) {

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		assert.Equal(t, "/insert/report", r.URL.Path)
		assert.Equal(t, http.MethodPost, r.Method)

		retryConfig := RetryConfig{
			MaxRetries:      5,
			InitialInterval: 1 * time.Second,
			MaxInterval:     10 * time.Second,
			BackoffFactor:   2,
		}

		retryStrategy := ExponentialBackoffWithJitter(retryConfig.InitialInterval, retryConfig.MaxInterval, retryConfig.BackoffFactor)
		
		conn, err := WSConnectWithRetry(w, r, retryConfig, retryStrategy)
		assert.NoError(t, err)

		client := &Client{conn: conn}
		clients[client] = true

		reportIDs := []int64{10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}
		for _, reportID := range reportIDs {
			err := SendReportID(w, r, reportID)
			assert.NoError(t, err, "Should send report ID without error")
		}

	}))

	defer mockServer.Close()


	// wsURL := "ws" + mockServer.URL[len("http"):]
	// ws, _, err = websocket.DefaultDialer.Dial(wsURL, nil)
	// assert.NoError(t, err)

	// defer ws.Close()

	// var receivedID int64
	// err = ws.ReadJSON(&receivedID)
	// assert.NoError(t, err, "Should read JSON without error")
	// assert.Equal(t, reportID, receivedID, "Received report ID should match sent report ID")

}


func TestInsertReportHandler(t *testing.T){

	reportsKeys := [4]string{"reports", "reports_city", "reports_province", "reports_per_mollusk"}
	report := &types.Reported_Cases{
		Longitude: 2.2,
		Latitude: 3.0,
		City: "panabo",
		Province: "del norte",
		District: "gredu",
		MolluskType: "scaly clam",
		UserID: 5,
	}

	jsonData, err := json.Marshal(report)
	assert.NoError(t, err)

	req, err := http.NewRequest(http.MethodPost, "/insert/report", bytes.NewBuffer(jsonData))
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)



	mockDB.On("InsertReport", report).Return(10, nil)
	mockREDIS.On("DELETEBYKEY", reportsKeys, req).Return(nil)

	mockJSON.On("JsonEncode", rr, http.StatusOK, "Reported Successfully").Run(func(args mock.Arguments) {
		w := args.Get(0).(http.ResponseWriter)
		
		status := args.Get(1).(int)
		response := args.Get(2).(string)

		w.WriteHeader(status)
		w.Write([]byte(response))

	}).Return(nil)

	assert.Equal(t, http.MethodPost, req.Method)
	err = reportsHandler.InsertReportHandler(rr, req)

	mockDB.AssertExpectations(t)
	mockREDIS.AssertExpectations(t)
	mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Reported Successfully")

}

func TestFetchAllReportsHandler(t *testing.T){

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

	req, err := http.NewRequest(http.MethodGet, "/fetch/reports", nil)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()
	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)

	var fetchReportsStruct []*types.Fetch_Cases

	mockDB.On("FetchReportedCases").Return(fetchReports, nil)
	mockREDIS.On("GET", &fetchReportsStruct, "reports", req).Return(redis.Nil)
	mockREDIS.On("SET", fetchReports, "reports", req).Return(nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, fetchReports).Return(nil)

	assert.Equal(t, http.MethodGet, req.Method)
	err = reportsHandler.FetchAllReportsHandler(rr, req)

	mockDB.AssertExpectations(t)
	mockREDIS.AssertExpectations(t)
	mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)

}



func TestFetchYearlyReportByCityHandler(t *testing.T){
	fetchCityReports := []*types.YearlyReportsPerCity{
		{
			City: "Panabo",
			Year: "2024",
			ReportsCount: 10,
		},

		{
			City: "Tagum",
			Year: "2024",
			ReportsCount: 5,
		},
	}

	req, err := http.NewRequest(http.MethodGet, "/fetch/reports/city", nil)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()
	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)


	var fetchCityReportsStruct []*types.YearlyReportsPerCity

	mockDB.On("FetchPerCityReports").Return(fetchCityReports, nil)
	mockREDIS.On("GET", &fetchCityReportsStruct, "reports_city", req).Return(redis.Nil)
	mockREDIS.On("SET", fetchCityReports, "reports_city", req).Return(nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, fetchCityReports).Return(nil)

	assert.Equal(t, http.MethodGet, req.Method)

		
	err = reportsHandler.FetchYearlyReportByCityHandler(rr, req)

	mockDB.AssertExpectations(t)
	mockREDIS.AssertExpectations(t)
	mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
}


func TestFetchYearlyReportByProvinceHandler(t *testing.T){

	fetchProvinceReports := []*types.YearlyReportsPerProvince{
		{
			Province: "Davao Del Norte",
			Year: "2024",
			ReportsCount: 10,
		},

		{
			Province: "Davao Del Norte",
			Year: "2024",
			ReportsCount: 5,
		},
	}

	req, err := http.NewRequest(http.MethodGet, "/fetch/reports/province", nil)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()
	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)


	var fetchProvinceReportsStruct []*types.YearlyReportsPerProvince

	mockDB.On("FetchPerProvinceReports").Return(fetchProvinceReports, nil)
	mockREDIS.On("GET", &fetchProvinceReportsStruct, "reports_province", req).Return(redis.Nil)
	mockREDIS.On("SET", fetchProvinceReports, "reports_province", req).Return(nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, fetchProvinceReports).Return(nil)

	assert.Equal(t, http.MethodGet, req.Method)
	err = reportsHandler.FetchYearlyReportByProvinceHandler(rr, req)

	mockDB.AssertExpectations(t)
	mockREDIS.AssertExpectations(t)
	mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)

}


func TestFetchReportPerMollusk(t *testing.T){

	fetchMolluskReports := []*types.ReportsPerMollusk{
		{
			MolluskType: "Scaly Clam",
			MolluskCount: 10,
		},

		{
			MolluskType: "Bullmouth Helmet",
			MolluskCount: 15,
		},
	}

	req, err := http.NewRequest(http.MethodGet, "/fetch/reports/mollusk", nil)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()
	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)


	var fetchMolluskReportsStruct []*types.ReportsPerMollusk

	mockDB.On("FetchReportsPerMollusk").Return(fetchMolluskReports, nil)
	mockREDIS.On("GET", &fetchMolluskReportsStruct, "reports_per_mollusk", req).Return(redis.Nil)
	mockREDIS.On("SET", fetchMolluskReports, "reports_per_mollusk", req).Return(nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, fetchMolluskReports).Return(nil)

	assert.Equal(t, http.MethodGet, req.Method)
	err = reportsHandler.FetchReportPerMollusk(rr, req)

	mockDB.AssertExpectations(t)
	mockREDIS.AssertExpectations(t)
	mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)

}


func TestUpdateReportStatusHandler(t *testing.T) {

	reportID := "4"
	reqURL := "/update/report/status/{report_id}"

	req, err := http.NewRequest(http.MethodPut, reqURL, nil)
	req.SetPathValue("report_id", reportID)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()

	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)

    mockDB.On("UpdateReportStatus", int64(4)).Return(nil)
	mockREDIS.On("DELETE", "reports", req).Return(nil)

	mockJSON.On("JsonEncode", rr, http.StatusOK, "Report Status Updated!").Run(func(args mock.Arguments) {
		w := args.Get(0).(http.ResponseWriter)

		status := args.Get(1).(int)
		response := args.Get(2).(string)

		w.WriteHeader(status)
		w.Write([]byte(response))

	}).Return(nil)


	assert.Equal(t, http.MethodPut, req.Method)
	err = reportsHandler.UpdateReportStatusHandler(rr, req)

	mockDB.AssertExpectations(t)
    mockREDIS.AssertExpectations(t)
    mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Report Status Updated!")
}


func TestDeleteReportHandler(t *testing.T) {

	reportID := "4"
	reqURL := "/delete/reports/{report_id}"
	reportsKeys := [4]string{"reports", "reports_city", "reports_province", "reports_per_mollusk"}

	req, err := http.NewRequest(http.MethodDelete, reqURL, nil)
	req.SetPathValue("report_id", reportID)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()

	mockDB := reportsHandler.DB_METHOD.(*MockReportsDBMethod)
	mockREDIS := reportsHandler.REDIS_METHOD.(*mock_methods.MockRedisMethod)
	mockJSON := reportsHandler.JSON_METHOD.(*mock_methods.MockJSONMethod)

    mockDB.On("DeleteReportCases", int64(4)).Return(nil)
	mockREDIS.On("DELETEBYKEY", reportsKeys, req).Return(nil)


	mockJSON.On("JsonEncode", rr, http.StatusOK, "Report Deleted").Run(func(args mock.Arguments) {
		w := args.Get(0).(http.ResponseWriter)

		status := args.Get(1).(int)
		response := args.Get(2).(string)

		w.WriteHeader(status)
		w.Write([]byte(response))

	}).Return(nil)


	assert.Equal(t, http.MethodDelete, req.Method)
	err = reportsHandler.DeleteReportHandler(rr, req)

	mockDB.AssertExpectations(t)
    mockREDIS.AssertExpectations(t)
    mockJSON.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Report Deleted")
}
