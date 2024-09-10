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