package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/johnkristanf/clamscanner/mock_methods"
	"github.com/johnkristanf/clamscanner/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)


type MockDBMethod struct {
	mock.Mock
}


func (m *MockDBMethod) AddDatasetClass(newClass *types.NewClass) error {
	args := m.Called(newClass)
	return args.Error(0)
}

func (m *MockDBMethod) FetchDatasetClasses() ([]*types.Fetch_DatasetClass, error) {
	args := m.Called()
	return args.Get(0).([]*types.Fetch_DatasetClass), args.Error(1)
}

func (m *MockDBMethod) UpdateDatasetClassInfo(editClass *types.EditClass) error {
	args := m.Called(editClass)
	return args.Error(0)
}

func (m *MockDBMethod) DeleteDatasetClass(classID int) error {
	args := m.Called(classID)
	return args.Error(0)
}


func setupHandlers() *DatasetsHandlers {
	return &DatasetsHandlers{
		DB_METHOD: new(MockDBMethod),
		JSON_METHOD: new(mock_methods.MockJSONMethod),
		JWT_METHOD: new(mock_methods.MockJWTMethod),
		REDIS_METHOD: new(mock_methods.MockRedisMethod),
	}
}


func TestAddDatasetClassHandler(t *testing.T) {

	handler := setupHandlers()

	newClass := &types.NewClass{
		Name: "Test ClassName",
		ScientificName: "Test ScientificName",
		Description: "Test Description",
		Status: "Test Status",
	}

	jsonData, _ := json.Marshal(newClass)
	req, err := http.NewRequest(http.MethodPost, "/add/dataset/class", bytes.NewBuffer(jsonData))
	assert.NoError(t, err)


	rr := httptest.NewRecorder()

	mockDB := handler.DB_METHOD.(*MockDBMethod)
	mockJSON := handler.JSON_METHOD.(*mock_methods.MockJSONMethod)

	mockDB.On("AddDatasetClass", newClass).Return(nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, "Dataset Class Added!").Run(func(args mock.Arguments) {
		w := args.Get(0).(http.ResponseWriter)

		status := args.Get(1).(int)

		// the reason you get 2 here is because of the index of the string 0(Dataset) 1(Class) 2(Added!)
		response := args.Get(2).(string)

		w.WriteHeader(status)
		w.Write([]byte(response))
	}).Return(nil)


	assert.Equal(t, http.MethodPost, req.Method)
	err = handler.AddDatasetClassHandler(rr, req)

	mockJSON.AssertExpectations(t)
	mockDB.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Dataset Class Added!")
}


func TestEditDatasetClassHandler(t *testing.T) {

	handler := setupHandlers()

	editClassData := &types.EditClass{
		ID: 4,
		ScientificName: "Test ScientificName",
		Description: "Test Description",
		Status: "Test Status",
	}

	jsonData, _ := json.Marshal(editClassData)
	req, err := http.NewRequest(http.MethodPost, "/edit/dataset/class", bytes.NewBuffer(jsonData))
	assert.NoError(t, err)


	rr := httptest.NewRecorder()

	mockDB := handler.DB_METHOD.(*MockDBMethod)
	mockJSON := handler.JSON_METHOD.(*mock_methods.MockJSONMethod)

	mockDB.On("UpdateDatasetClassInfo", editClassData).Return(nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, "Dataset Class Edited!").Run(func(args mock.Arguments) {
		w := args.Get(0).(http.ResponseWriter)

		status := args.Get(1).(int)

		// the reason you get 2 here is because of the index of the string 0(Dataset) 1(Class) 2(Edited!)
		response := args.Get(2).(string)

		w.WriteHeader(status)
		w.Write([]byte(response))
	}).Return(nil)


	assert.Equal(t, http.MethodPost, req.Method)
	err = handler.EditDatasetClassHandler(rr, req)

	mockJSON.AssertExpectations(t)
	mockDB.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Dataset Class Edited!")
}



func TestFetchDatasetClassHandler(t *testing.T) {

	handler := setupHandlers()

	req, err := http.NewRequest(http.MethodGet, "/fetch/dataset/class", nil)
	assert.NoError(t, err)


	rr := httptest.NewRecorder()

	mockDB := handler.DB_METHOD.(*MockDBMethod)
	mockJSON := handler.JSON_METHOD.(*mock_methods.MockJSONMethod)

	datasetClasses := []*types.Fetch_DatasetClass{
        {
            ID:   1,
            Name: "Class1",
			ScientificName: "Test Scientific Name 1",
			Description: "Test Description 1",
			Status: "Test Status 1",
			Count: 1,
        },
		{
            ID:   2,
            Name: "Class2",
			ScientificName: "Test Scientific Name 2",
			Description: "Test Description 2",
			Status: "Test Status 2",
			Count: 2,
        },
    }

	mockDB.On("FetchDatasetClasses").Return(datasetClasses, nil)
	mockJSON.On("JsonEncode", rr, http.StatusOK, datasetClasses).Return(nil)


	assert.Equal(t, http.MethodGet, req.Method)
	err = handler.FetchDatasetClassHandler(rr, req)

	mockJSON.AssertExpectations(t)
	mockDB.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
}




func TestDeleteDatasetClassHandler(t *testing.T) {
	
	handler := setupHandlers()

	classID := "4"
	className := "mockClassName"
	reqURL := "/delete/class/{class_id}/{className}"

	req, err := http.NewRequest(http.MethodDelete, reqURL, nil)
	req.SetPathValue("class_id", classID)
	req.SetPathValue("className", className)

	assert.NoError(t, err)


	rr := httptest.NewRecorder()

	mockDB := handler.DB_METHOD.(*MockDBMethod)
	mockJSON := handler.JSON_METHOD.(*mock_methods.MockJSONMethod)

	mockDB.On("DeleteDatasetClass", 4).Return(nil)

	mockJSON.On("JsonEncode", rr, http.StatusOK, "Dataset Class Deleted!").Run(func(args mock.Arguments) {
		w := args.Get(0).(http.ResponseWriter)
		status := args.Get(1).(int)

		// the reason you get 2 here is because of the index of the string 0(Dataset) 1(Class) 2(Deleted!)
		response := args.Get(2).(string)

		w.WriteHeader(status)
		w.Write([]byte(response))

	}).Return(nil)


	assert.Equal(t, http.MethodDelete, req.Method)
	err = handler.DeleteDatasetClassHandler(rr, req)

	mockJSON.AssertExpectations(t)
	mockDB.AssertExpectations(t)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Dataset Class Deleted!")
}


func TestRequestPythonDSClass(t *testing.T){

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/add/dataset/class", r.URL.Path)
		assert.Equal(t, http.MethodPost, r.Method)

		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))

		var folder struct {
			Path string `json:"folder_path"`
		}

		err := json.NewDecoder(r.Body).Decode(&folder)
		assert.NoError(t, err)
		assert.Equal(t, "mock/path", folder.Path)

		w.WriteHeader(http.StatusOK)

	}))

	defer mockServer.Close()


	handler := &DatasetsHandlers{}
	
	urls := []string{
		"http://localhost:5000/add/dataset/class",
		"http://localhost:5000/delete/dataset/class",
	} 

	for _, url := range urls {
		err := handler.requestPythonDSClass("mock/path", url)
		assert.NoError(t, err)
	}
}