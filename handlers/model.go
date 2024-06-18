package handlers

import (
	
	"io"
	"net/http"	
	"github.com/johnkristanf/clamscanner/database"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/middlewares"
)

type ModelHandlers struct {
	DB_METHOD    			database.MODEL_DB_METHOD
	JSON_METHOD  			helpers.JSON_METHODS
	JWT_METHOD   			middlewares.JWT_METHOD
	REDIS_METHOD 			middlewares.REDIS_METHOD
}


type RESPONSE struct{
	Body 	io.ReadCloser
	Error 	error	
}


// func (h *ModelHandlers) TrainModelHandler(w http.ResponseWriter, r *http.Request) error {

// 	var model *types.Train
// 	errorChan := make(chan error, 1)
// 	h.JSON_METHOD.JsonDecode(r, &model)

// 	fmt.Println("version: ", model.Version)

// 	go func() {
// 		defer close(errorChan)

// 		err := h.MakeModelTrainRequest("datasets", model.Version, w, r)
// 		if err != nil {
// 			errorChan <- err
// 		}

// 	}()

// 	if err := <-errorChan; err != nil {
// 		return err
// 	}

// 	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Trained Successfully")
// }




// func (h *ModelHandlers) MakeModelTrainRequest(rootFolder string, modelVersion string, w http.ResponseWriter, r *http.Request) error {

// 	ctx, cancel := context.WithTimeout(r.Context(), time.Second * 40)
// 	defer cancel()

// 	errorChan := make(chan error, 1)
// 	responseChan := make(chan *RESPONSE, 1)

// 	body := &bytes.Buffer{}
// 	writer := multipart.NewWriter(body)

// 	wr, err := writer.CreateFormField("model_version")
// 	if err != nil{
// 		return err
// 	}

// 	_, err = io.WriteString(wr, modelVersion)
// 	if err != nil{
// 		return err
// 	}


	
// 	err = filepath.Walk(rootFolder, func(path string, info fs.FileInfo, walkErr error) error {
// 		if walkErr != nil {
// 			return walkErr
// 		}

// 		if info.IsDir() {
// 			return nil
// 		}

// 		file, openErr := os.Open(path)
// 		if openErr != nil {
// 			return openErr
// 		}
// 		defer file.Close()

// 		part, createErr := writer.CreateFormFile("files", filepath.Join(strings.TrimPrefix(path, rootFolder+string(filepath.Separator))))
// 		if createErr != nil {
// 			return createErr
// 		}

// 		_, copyErr := io.Copy(part, file)
// 		if copyErr != nil {
// 			return copyErr
// 		}

// 		return nil
// 	})

// 	if err != nil {
// 		return err
// 	}
// 	writer.Close()

// 	go func(){
// 		defer close(responseChan)

// 		resBody, err := FormRequest("POST", "http://127.0.0.1:5000/train/model", body, writer)
// 		if err != nil{
// 			responseChan <- &RESPONSE{ Body: nil, Error: err }
// 		}

// 		responseChan <- &RESPONSE{ Body: resBody, Error: nil } 
// 	}()


// 	select {

// 		case <- ctx.Done():
// 			return h.JSON_METHOD.JsonEncode(w, http.StatusRequestTimeout, "Request Timeout: ClamScanner took too long to respond")

// 		case response := <- responseChan:
// 			if response.Error != nil{
// 				return response.Error
// 			}

// 			var modelDetails *types.ModelDetails
// 			if err := json.NewDecoder(response.Body).Decode(&modelDetails); err != nil{
// 				return err
// 			}

// 			response.Body.Close()
			
// 			go func ()  {
// 				defer close(errorChan)
// 				if err := h.DB_METHOD.InsertModelDetails(modelDetails); err != nil{
// 					errorChan <- err
// 				}
// 			}()

// 			if err := <- errorChan; err != nil{
// 				return err
// 			}
// 	}

// 	return nil
// }


// func FormRequest(method string, url string, body *bytes.Buffer, writer *multipart.Writer) (io.ReadCloser, error){

// 	req, err := http.NewRequest(method, url, body)
// 	if err != nil {
// 		return nil, err
// 	}

// 	req.Header.Add("Content-Type", writer.FormDataContentType())
// 	client := &http.Client{}

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resp.Body.Close()

// 	return resp.Body, nil

// }


// func scanImageRequest(method string, url string, body io.Reader) (io.ReadCloser, error) {

// 	req, err := http.NewRequest(method, url, body)
// 	if err != nil {
// 		return nil, err
// 	}
// 	client := &http.Client{}

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return resp.Body, nil
// }


// func (h *ModelHandlers) ScanHandler(w http.ResponseWriter, r *http.Request) error {
// 	fmt.Println("JAKEEEE ABOT DIIRII")

// 	ctx, cancel := context.WithTimeout(r.Context(), time.Second * 20)
// 	defer cancel()

// 	var capture *types.Capture
// 	responseChan := make(chan *RESPONSE, 1)
// 	h.JSON_METHOD.JsonDecode(r, &capture)

// 	decoded, err := base64.StdEncoding.DecodeString(capture.Base64Image)
// 	if err != nil{
// 		return err
// 	}
	

// 	go func(){
// 		defer close(responseChan)

// 		resBody, err := scanImageRequest("POST", "http://127.0.0.1:5000/image/scan", bytes.NewReader(decoded))
// 		if err != nil{
// 			responseChan <- &RESPONSE{ Body: nil, Error: err }
// 		}

// 		responseChan <- &RESPONSE{ Body: resBody, Error: nil } 
// 	}()

// 		// case <- ctx.Done():
// 		// 	return h.JSON_METHOD.JsonEncode(w, http.StatusRequestTimeout, "Request Timeout: ClamScanner took too long to respond")

// 		response := <- responseChan

// 		molluskChan := make(chan *types.MolluskDetails, 1)
// 		errChan := make(chan error, 1)

// 		if response.Error != nil{
// 			return response.Error
// 		}

// 		var mollusk *types.Mollusk
// 		if err := json.NewDecoder(response.Body).Decode(&mollusk); err != nil{
// 			return err
// 		}
// 		response.Body.Close()

// 		fmt.Println("mollusk name: ", mollusk.ClassifiedMollusk)

// 		go func ()  {
// 			defer close(molluskChan)
// 			defer close(errChan)

// 			molluskDetails, err := h.DB_METHOD.FetchClassifiedMolluskDetails(mollusk.ClassifiedMollusk)
// 			if err != nil{
// 				errChan <- err
// 			}

// 			molluskChan <- molluskDetails
// 		}()

// 		select{
// 			case err := <- errChan:
// 			if err != nil{
// 				return err
// 			}

// 			case molluskDetails := <- molluskChan:
// 				fmt.Println("molluskDetails: ", molluskDetails)
// 				return h.JSON_METHOD.JsonEncode(w, http.StatusOK, molluskDetails)
// 		}

// 	return nil	

// }

func (h *ModelHandlers) FetchIdentifiedMolluskHandler(w http.ResponseWriter, r *http.Request) error {

	molluskDetails, err := h.DB_METHOD.FetchClassifiedMolluskDetails(r.PathValue("mollusk_name"))
	if err != nil{
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, molluskDetails)
}



func (h *ModelHandlers) FetchModelsHandler(w http.ResponseWriter, r *http.Request) error {

	models, err := h.DB_METHOD.FetchModels()
	if err != nil{
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, models)
}