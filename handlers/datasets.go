package handlers

import (
	"bytes"
	"encoding/json"
	
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"

	"github.com/johnkristanf/clamscanner/database"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/middlewares"
	"github.com/johnkristanf/clamscanner/types"
)

type DatasetsHandlers struct {
	DB_METHOD    			database.DATASET_DB_METHOD
	JSON_METHOD  			helpers.JSON_METHODS
	JWT_METHOD   			middlewares.JWT_METHOD
	REDIS_METHOD 			middlewares.REDIS_METHOD
	IMAGE_HELPERS_METHODS 	helpers.IMAGES_HELPERS_METHODS
}


var wg sync.WaitGroup

func (h *DatasetsHandlers) AddDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	var newClassData *types.NewClass
	errorChan := make(chan error, 2)


	h.JSON_METHOD.JsonDecode(r, &newClassData)

    dynamicFolderPath := filepath.Join("datasets", newClassData.Name)

	wg.Add(1)
    go func() {
        defer wg.Done()
        if err := h.DB_METHOD.AddDatasetClass(newClassData); err != nil {
            errorChan <- err
        }
    }()

	
    wg.Add(1)
    go func() {
        defer wg.Done()
        if err := h.addPythonDSClass(dynamicFolderPath); err != nil {
            errorChan <- err
        }
    }()


    go func() {
        wg.Wait()
        close(errorChan)
    }()


	for err := range errorChan {
        if err != nil {
            return err
        }
    }
	
	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Dataset Class Added!")
}


func (h *DatasetsHandlers) addPythonDSClass(path string) error {
	type Folder struct{
		Path string `json:"folder_path"`
	}

	folder := Folder{
       Path: path,
    }

	jsonData, err := json.Marshal(folder)
    if err != nil {
       return err
    }

    url := "http://localhost:5000/add/dataset/class"
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
       return err
    }
    defer resp.Body.Close()

	return nil
}


func (h *DatasetsHandlers) EditDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	var editClassInfo *types.EditClass
	h.JSON_METHOD.JsonDecode(r, &editClassInfo)

	if err := h.DB_METHOD.UpdateDatasetClassInfo(editClassInfo); err != nil{
		return err
	}

	return nil
}


// func (h *DatasetsHandlers) proccessUploadImage(files []*multipart.FileHeader, destFolder string, wg *sync.WaitGroup) error {
// 	defer wg.Done()

// 	for _, fileHeader := range files {
// 		wg.Add(1)

// 		file, err := fileHeader.Open()
// 		if err != nil {
// 			return err
// 		}
// 		defer file.Close()

// 		if !h.IMAGE_HELPERS_METHODS.IsValidImage(file) {
// 			continue
// 		}

// 		if _, err := file.Seek(0, io.SeekStart); err != nil {
// 			return err
// 		}

// 		destFile, err := os.Create(filepath.Join(destFolder, fileHeader.Filename))
// 		if err != nil {
// 			return err
// 		}
// 		defer destFile.Close()

// 		_, err = io.Copy(destFile, file)
// 		if err != nil {
// 			return err
// 		}
// 	}

// 	return nil
// }



// func (h *DatasetsHandlers) UploadImageDatasetHandler(w http.ResponseWriter, r *http.Request) error {

// 	var wg sync.WaitGroup

// 	if err := r.ParseMultipartForm(100 * 1024 * 1024); err != nil {
// 		return err
// 	}

// 	uploadErrChan := make(chan error, 1)

// 	formDatasetClass := r.FormValue("datasetClass")
// 	formDatasetClassID := r.FormValue("class_id")
// 	formDatasetFiles := r.MultipartForm.File["images"]

// 	fmt.Println("formDatasetClass: ", formDatasetClass)

// 	destFolder := filepath.Join("datasets", formDatasetClass)

// 	classID, err := strconv.Atoi(formDatasetClassID)
// 	if err != nil {
// 		return err
// 	}


// 	go func() {

// 		defer close(uploadErrChan)

// 		if err := h.proccessUploadImage(formDatasetFiles, destFolder, &wg); err != nil {
// 			uploadErrChan <- err
// 		}

// 	}()

// 	wg.Wait()

// 	if err := <-uploadErrChan; err != nil {
// 		if err.Error() == "invalid image type"{
// 			return h.JSON_METHOD.JsonEncode(w, http.StatusUnsupportedMediaType, "Invalid Image Type Please Upload Another!")
// 		} else {
// 			return err
// 		}
// 	}


// 	imgcount, err := h.IMAGE_HELPERS_METHODS.CountImages(destFolder)
// 	if err != nil {
// 		return err
// 	}

	
// 	if err := h.DB_METHOD.UpdateDatasetClassData(imgcount, classID); err != nil {
// 		return err
// 	}


// 	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Uploaded")
// }

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
    

	// files, err := os.ReadDir(folderPath)
	// if err != nil {
	// 	return err
	// }

	// for _, file := range files {

	// 	if !file.IsDir() && isImage(file.Name()) {

	// 		imagePath := filepath.Join(folderPath, file.Name())
	// 		imageData, err := os.ReadFile(imagePath)
	// 		if err != nil {
	// 			return err
	// 		}

	// 		contentType := http.DetectContentType(imageData)
	// 		w.Header().Set("Content-Type", contentType)

	// 		_, err = w.Write(imageData)
	// 		if err != nil {
	// 			return err
	// 		}

	// 		if f, ok := w.(http.Flusher); ok {
	// 			f.Flush()
	// 		}

	// 		fmt.Println("File: ", file.Name(), "is send successfully")

	// 	}
	// }

	// return nil


	// imageDataBufferMap := make(map[string][][]byte)
	// var buffArray [][]byte

	// files, err := os.ReadDir(folderPath)
	// if err != nil{
	// 	return err
	// }

	// for _, file := range files {

	//     if !file.IsDir() && isImage(file.Name()) {

	//         imagePath := filepath.Join(folderPath, file.Name())

	//         imageData, err := os.ReadFile(imagePath)
	//         if err != nil {
	//             fmt.Println("Error reading file:", err)
	//             continue
	//         }

	// 		buffArray = append(buffArray, imageData)

	// 		fmt.Println("Image", file.Name(), "sent successfully")

	//     }
	// }

	// imageDataBufferMap["images"] = buffArray

	// fmt.Println("imageDataBufferMap", imageDataBufferMap)

	// return h.JSON_METHOD.JsonEncode(w, http.StatusOK, imageDataBufferMap)

}

func (h *DatasetsHandlers) DeleteDatasetClassHandler(w http.ResponseWriter, r *http.Request) error {

	errorChan := make(chan error, 1)
	classID, err := strconv.Atoi(r.PathValue("class_id"))
	if err != nil {
		return err
	}

	dynamicFolderPath := filepath.Join("datasets", r.PathValue("className"))


	wg.Add(1)
    go func() {
        defer wg.Done()
        if err := h.DB_METHOD.DeleteDatasetClass(classID); err != nil {
            errorChan <- err
        }
    }()

	
    wg.Add(1)
    go func() {
        defer wg.Done()
        if err := h.deletePythonDSClass(dynamicFolderPath); err != nil {
            errorChan <- err
        }
    }()

	go func() {
        wg.Wait()
        close(errorChan)
    }()


	for err := range errorChan {
        if err != nil {
            return err
        }
    }
	
	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "DELETE NA DOL")
}


func (h *DatasetsHandlers) deletePythonDSClass(path string) error {
	type Folder struct{
		Path string `json:"folder_path"`
	}

	folder := Folder{
       Path: path,
    }

	jsonData, err := json.Marshal(folder)
    if err != nil {
       return err
    }

    url := "http://localhost:5000/delete/dataset/class"
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
       return err
    }
    defer resp.Body.Close()

	return nil
}

