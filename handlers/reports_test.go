package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/johnkristanf/clamscanner/mock_methods"
	"github.com/johnkristanf/clamscanner/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockReportsDBMethod struct {
	mock.Mock
}


func (m *MockReportsDBMethod) InsertReport(reportCases *types.Reported_Cases) (int64, error) {
	args := m.Called(reportCases)
	return int64(args.Int(0)), args.Error(1)
}


func (m *MockReportsDBMethod) FetchReportedCases() ([]*types.Fetch_Cases, error) {
	args := m.Called()
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

func setupReportsHandlers() *ReportHandler {
	return &ReportHandler{
		DB_METHOD: new(MockReportsDBMethod),
		JSON_METHOD: new(mock_methods.MockJSONMethod),
		JWT_METHOD: new(mock_methods.MockJWTMethod),
		REDIS_METHOD: new(mock_methods.MockRedisMethod),
	}
}

var reportHandler = setupReportsHandlers()

func TestWSConnectWithRetry(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
		err := reportHandler.WebsocketConnHandler(w, r)
		assert.NoError(t, err)

	}))

	defer mockServer.Close()
	url := "ws" + mockServer.URL[len("http"):]

	wsURL := url + "/ws"
	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	assert.NoError(t, err)
	assert.NotNil(t, ws, "WebSocket connection should be established")

	defer ws.Close()

}


func TestSendReportID(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		retryConfig := RetryConfig{
			MaxRetries:      5,
			InitialInterval: 1 * time.Second,
			MaxInterval:     10 * time.Second,
			BackoffFactor:   2,
		}

		retryStrategy := ExponentialBackoff(retryConfig.InitialInterval, retryConfig.MaxInterval, retryConfig.BackoffFactor)
		
		for {
			conn, err := WSConnectWithRetry(w, r, retryConfig, retryStrategy)
			assert.NoError(t, err)
	
			client := &Client{conn: conn}
			Clients[client] = true	
		}
	}))

	defer mockServer.Close()

	// wsURL := "ws" + mockServer.URL[len("http"):]
	// ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	// if err != nil {
	// 	t.Fatalf("Failed to connect to WebSocket: %v", err)
	// }
	// defer ws.Close()

	reportIDs := []int64{10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}
	for _, reportID := range reportIDs {
		err := SendReportID(reportID)
		assert.NoError(t, err, "Should send report ID without error")

	// 	var receivedID int64
	// 	err = ws.ReadJSON(&receivedID)
	// 	assert.NoError(t, err, "Should read JSON without error")
	// 	assert.Equal(t, reportID, receivedID, "Received report ID should match sent report ID")
	}

}


