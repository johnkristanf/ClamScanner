package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/johnkristanf/clamscanner/database"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/middlewares"
	"github.com/johnkristanf/clamscanner/types"
)

type ReportHandler struct {
	DB_METHOD    database.REPORTED_DB_METHOD
	JSON_METHOD  helpers.JSON_METHODS
	JWT_METHOD   middlewares.JWT_METHOD
	REDIS_METHOD middlewares.REDIS_METHOD
}

func wsOrigin(r *http.Request) bool {
	allowedOrigin := "http://localhost:1500"
	return r.Header.Get("Origin") == allowedOrigin
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     wsOrigin,
}

type Client struct {
	conn *websocket.Conn
}

type RetryConfig struct {
	MaxRetries      int
	InitialInterval time.Duration
	MaxInterval     time.Duration
	BackoffFactor   float64
}

type RetryStrategy func(int) time.Duration

var clients = make(map[*Client]bool)

func SendReportID(lastInsertedIDs int64) error {

	for client := range clients {

		if err := client.conn.WriteJSON(lastInsertedIDs); err != nil {
			fmt.Printf("Error writing JSON data to client: %v\n", err)

			client.conn.Close()
            delete(clients, client)

			return err
		}
	}

	return nil
}


func ExponentialBackoff(initialInterval, maxInterval time.Duration, backOffFactor float64) RetryStrategy {
	return func(attempt int) time.Duration {

		interval := float64(initialInterval) * (backOffFactor * float64(attempt))

		if interval > float64(maxInterval) {
			interval = float64(maxInterval)
		}

		return time.Duration(interval)
	}
}

func WSConnectWithRetry(w http.ResponseWriter, r *http.Request, retryConfig RetryConfig, retryStrategy RetryStrategy) (conn *websocket.Conn, err error) {

	for attempt := 1; attempt <= retryConfig.MaxRetries; attempt++ {
		fmt.Printf("Attempting to Reconnect to Websocket (attempt: %d)\n", attempt)

		conn, err = upgrader.Upgrade(w, r, nil)
		if err == nil {
			fmt.Println("Connected successfully")
			return conn, nil
		}

		fmt.Println("Failed to connect error: ", err)

		if attempt < retryConfig.MaxRetries {
			retryInterval := retryStrategy(attempt)
			fmt.Printf("Retrying in %s...\n", retryInterval)
			time.Sleep(retryInterval)

		}

	}

	return nil, fmt.Errorf("failed to connect after %d attempts", retryConfig.MaxRetries)

}

func (h *ReportHandler) WebsocketConnHandler(w http.ResponseWriter, r *http.Request) error {
    retryConfig := RetryConfig{
        MaxRetries:      5,
        InitialInterval: 1 * time.Second,
        MaxInterval:     10 * time.Second,
        BackoffFactor:   2,
    }

    retryStrategy := ExponentialBackoff(retryConfig.InitialInterval, retryConfig.MaxInterval, retryConfig.BackoffFactor)

    for {
        conn, err := WSConnectWithRetry(w, r, retryConfig, retryStrategy)
        if err != nil {
            fmt.Printf("Failed to connect to WebSocket: %v\n", err)
            time.Sleep(retryStrategy(1))
            continue
        }

        client := &Client{conn: conn}
        clients[client] = true

        return nil
    }
}

// ------------------ END OF WEBSOCKET CONFIGURATIONS----------------------------


func (h *ReportHandler) InsertReportHandler(w http.ResponseWriter, r *http.Request) error {

	var reportedCases *types.Reported_Cases
	errorChan := make(chan error, 1)
	lastReportChan := make(chan int64, 1)

	h.JSON_METHOD.JsonDecode(r, &reportedCases)

	go func() {

		defer close(errorChan)
		defer close(lastReportChan)

		lastReportedID, err := h.DB_METHOD.InsertReport(reportedCases)
		if err != nil {
			errorChan <- err
		}

		lastReportChan <- lastReportedID

	}()

	select {

		case err := <-errorChan:
			if err != nil {
				return err
			}

			
		case reportID := <- lastReportChan:

			reportKeys := [4]string{"reports", "reports_city", "reports_province", "reports_per_mollusk"}

			if err := h.REDIS_METHOD.DELETEBYKEY(reportKeys, r); err != nil {
				return err
			}


			if err := SendReportID(reportID); err != nil {
				return err
			}

}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Reported Successfully")
}

func (h *ReportHandler) FetchAllReportsHandler(w http.ResponseWriter, r *http.Request) error {

	var cases []*types.Fetch_Cases

	err := h.REDIS_METHOD.GET(&cases, "reports", r)

	if err == redis.Nil {

		cases, err := h.DB_METHOD.FetchReportedCases()
		if err != nil {
			return err
		}

		if err := h.REDIS_METHOD.SET(cases, "reports", r); err != nil {
			return err
		}

		return h.JSON_METHOD.JsonEncode(w, http.StatusOK, cases)

	} else if err != nil {
		return err
	}


	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, cases)

}

func (h *ReportHandler) FetchYearlyReportByCityHandler(w http.ResponseWriter, r *http.Request) error {

	var yearlyReports []*types.YearlyReportsPerCity

	err := h.REDIS_METHOD.GET(&yearlyReports, "reports_city", r)

	if err == redis.Nil {

		yearlyReports, err := h.DB_METHOD.FetchPerCityReports()
		if err != nil{
			return err
		}


		if err := h.REDIS_METHOD.SET(yearlyReports, "reports_city", r); err != nil {
			return err
		}

		return h.JSON_METHOD.JsonEncode(w, http.StatusOK, yearlyReports)

	} else if err != nil {
		return err
	}


	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, yearlyReports)	
}


func (h *ReportHandler) FetchYearlyReportByProvinceHandler(w http.ResponseWriter, r *http.Request) error {

	var yearlyReports []*types.YearlyReportsPerProvince

	err := h.REDIS_METHOD.GET(&yearlyReports, "reports_province", r)

	if err == redis.Nil {

		yearlyReports, err := h.DB_METHOD.FetchPerProvinceReports()
		if err != nil{
			return err
		}


		if err := h.REDIS_METHOD.SET(yearlyReports, "reports_province", r); err != nil {
			return err
		}

		return h.JSON_METHOD.JsonEncode(w, http.StatusOK, yearlyReports)

	} else if err != nil {
		return err
	}


	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, yearlyReports)	
}

func (h *ReportHandler) FetchReportPerMollusk(w http.ResponseWriter, r *http.Request) error {
	
	var reportsPerMollusk []*types.ReportsPerMollusk

	err := h.REDIS_METHOD.GET(&reportsPerMollusk, "reports_per_mollusk", r)

	if err == redis.Nil {

		reportsPerMollusk, err := h.DB_METHOD.FetchReportsPerMollusk()
		if err != nil{
			return err
		}


		if err := h.REDIS_METHOD.SET(reportsPerMollusk, "reports_per_mollusk", r); err != nil {
			return err
		}

		return h.JSON_METHOD.JsonEncode(w, http.StatusOK, reportsPerMollusk)

	} else if err != nil {
		return err
	}


	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, reportsPerMollusk)	
}


func (h *ReportHandler) UpdateReportStatusHandler(w http.ResponseWriter, r *http.Request) error {

	idParam := r.PathValue("report_id")
	report_id, err := strconv.Atoi(idParam)
	if err != nil {
		return err
	}


	if err := h.DB_METHOD.UpdateReportStatus(int64(report_id)); err != nil {
		return err
	}

	if err := h.REDIS_METHOD.DELETE("reports", r); err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Report Status Updated")

}



func (h *ReportHandler) DeleteReportHandler(w http.ResponseWriter, r *http.Request) error {

	idParam := r.PathValue("report_id")
	report_id, err := strconv.Atoi(idParam)
	if err != nil {
		return err
	}

	if err := h.DB_METHOD.DeleteReportCases(int64(report_id)); err != nil {
		return err
	}

	reportKeys := [4]string{"reports", "reports_city", "reports_province", "reports_per_mollusk"}

	if err := h.REDIS_METHOD.DELETEBYKEY(reportKeys, r); err != nil {
		return err
	}


	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Report Deleted")

}


