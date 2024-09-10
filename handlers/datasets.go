package handlers

import (
	"fmt"
	"os"
	"strings"

	"bytes"
	"encoding/json"

	"net/http"
	"path/filepath"
	"strconv"

	"github.com/johnkristanf/clamscanner/database"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/middlewares"
	"github.com/johnkristanf/clamscanner/types"
)

type DatasetsHandlers struct {
	DB_METHOD             database.DATASET_DB_METHOD
	JSON_METHOD           helpers.JSON_METHODS
	JWT_METHOD            middlewares.JWT_METHOD
	REDIS_METHOD          middlewares.REDIS_METHOD
	IMAGE_HELPERS_METHODS helpers.IMAGES_HELPERS_METHODS
}

func (h *DatasetsHandlers) requestPythonDSClass(path string, url string) error {
	type Folder struct {
		Path string `json:"folder_path"`
	}

	folder := Folder{
		Path: path,
	}

	jsonData, err := json.Marshal(folder)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

func (h *DatasetsHandlers) AddDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	var newClassData types.NewClass

	if err := json.NewDecoder(r.Body).Decode(&newClassData); err != nil {
		return fmt.Errorf("error decoding JSON: %w", err)
	}

	if err := h.DB_METHOD.AddDatasetClass(&newClassData); err != nil {
		return err
	}

	
	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Dataset Class Added!")
}

func (h *DatasetsHandlers) EditDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	var editClassInfo types.EditClass

	if err := json.NewDecoder(r.Body).Decode(&editClassInfo); err != nil {
		return fmt.Errorf("error in json decoding %d", err)
	}

	if err := h.DB_METHOD.UpdateDatasetClassInfo(&editClassInfo); err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Dataset Class Edited!")
}

func (h *DatasetsHandlers) FetchDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	datasets, err := h.DB_METHOD.FetchDatasetClasses()
	if err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, datasets)
}


func (h *DatasetsHandlers) FetchDatasetClassImagesHandler(w http.ResponseWriter, r *http.Request) error {

	classFolderParam := r.PathValue("classFolderName")
	folderPath := filepath.Join("datasets", classFolderParam)

	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		return err
	}

	files, err := os.ReadDir(folderPath)
	if err != nil {
		return err
	}

	for _, file := range files {

		if !file.IsDir() && h.IMAGE_HELPERS_METHODS.IsImage(file.Name()) {
			imagePath := filepath.Join(folderPath, file.Name())
			http.ServeFile(w, r, imagePath)
		}
	}

	return nil

}


func (h *DatasetsHandlers) DeleteDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	errorChan := make(chan error, 1)

	classID, err := strconv.Atoi(r.PathValue("class_id"))
	if err != nil {
		return err
	}

	path := filepath.Join("datasets", r.PathValue("className") + "/")

	dynamicFolderPath := strings.ReplaceAll(path, "\\", "/")

	if err := h.DB_METHOD.DeleteDatasetClass(classID); err != nil {
		return err	
	}

	go func() {
		defer close(errorChan)

		url := os.Getenv("DELETE_DS_URI")
		if err := h.requestPythonDSClass(dynamicFolderPath, url); err != nil {
			errorChan <- err
		}

	}()

	
	if err := <- errorChan; err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Dataset Class Deleted!")
}