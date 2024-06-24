package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/johnkristanf/clamscanner/mock_methods"
	"github.com/johnkristanf/clamscanner/types"
	"github.com/stretchr/testify/mock"
)

var benchmarkDatasetHandlers = setupDatasetsHandlers()

var mockDB = benchmarkDatasetHandlers.DB_METHOD.(*MockDatasetsDBMethod)
var mockJSON = benchmarkDatasetHandlers.JSON_METHOD.(*mock_methods.MockJSONMethod)

func BenchmarkAddDatasetClassHandler(b *testing.B) {

	mockDB.On("AddDatasetClass", mock.Anything).Return(nil)
	mockJSON.On("JsonEncode", mock.Anything, http.StatusOK, mock.AnythingOfType("string")).Return(nil)

	for i := 0; i < b.N; i++ {
		newClass := &types.NewClass{
			Name:           "Test ClassName",
			ScientificName: "Test ScientificName",
			Description:    "Test Description",
			Status:         "Test Status",
		}

		body, _ := json.Marshal(newClass)

		req := httptest.NewRequest("POST", "/add/dataset/class", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		benchmarkDatasetHandlers.AddDatasetClassHandler(rr, req)
	}

	mockDB.AssertExpectations(b)
	mockJSON.AssertExpectations(b)
}

func BenchmarkEditDatasetClassHandler(b *testing.B) {

	mockDB.On("UpdateDatasetClassInfo", mock.Anything).Return(nil)
	mockJSON.On("JsonEncode", mock.Anything, http.StatusOK, mock.AnythingOfType("string")).Return(nil)

	for i := 0; i < b.N; i++ {

		editClassData := &types.EditClass{
			ID:             4,
			ScientificName: "Test ScientificName",
			Description:    "Test Description",
			Status:         "Test Status",
		}

		jsonData, _ := json.Marshal(editClassData)

		req := httptest.NewRequest("PUT", "/edit/dataset/class", bytes.NewBuffer(jsonData))
		rr := httptest.NewRecorder()

		benchmarkDatasetHandlers.EditDatasetClassHandler(rr, req)
	}

	mockDB.AssertExpectations(b)
	mockJSON.AssertExpectations(b)
}

func BenchmarkFetchDatasetClassHandler(b *testing.B) {
	datasetClasses := []*types.Fetch_DatasetClass{
		{
			ID:             1,
			Name:           "Class1",
			ScientificName: "Test Scientific Name 1",
			Description:    "Test Description 1",
			Status:         "Test Status 1",
			Count:          1,
		},
		{
			ID:             2,
			Name:           "Class2",
			ScientificName: "Test Scientific Name 2",
			Description:    "Test Description 2",
			Status:         "Test Status 2",
			Count:          2,
		},
	}

	mockDB.On("FetchDatasetClasses", mock.Anything).Return(datasetClasses, nil)
	mockJSON.On("JsonEncode", mock.Anything, http.StatusOK, datasetClasses).Return(nil)

	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("GET", "/fetch/dataset/class", nil)
		rr := httptest.NewRecorder()

		benchmarkDatasetHandlers.FetchDatasetClassHandler(rr, req)
	}

	mockDB.AssertExpectations(b)
	mockJSON.AssertExpectations(b)
}

func BenchmarkDeleteDatasetClassHandler(b *testing.B) {

	mockDB.On("DeleteDatasetClass", 4).Return(nil)
	mockJSON.On("JsonEncode", mock.Anything, http.StatusOK, mock.AnythingOfType("string")).Return(nil)

	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("DELETE", "/delete/class/{class_id}/{className}", nil)
		req.SetPathValue("class_id", "4")
		req.SetPathValue("className", "testClassName")

		rr := httptest.NewRecorder()

		benchmarkDatasetHandlers.DeleteDatasetClassHandler(rr, req)
	}

	mockDB.AssertExpectations(b)
	mockJSON.AssertExpectations(b)
}

