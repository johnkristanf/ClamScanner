package helpers

import (
	"encoding/json"
	"log"
	"net/http"
)

type JsonMethods struct{}

type JSON_METHODS interface{
	JsonEncode(http.ResponseWriter, int, any) error
	JsonDecode(*http.Request, interface{}) 
}

func JsonConfig() (*JsonMethods){
	return &JsonMethods{}
}

func (j *JsonMethods) JsonEncode(w http.ResponseWriter, status int,  val any) error {

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(val); 

}


func (j *JsonMethods) JsonDecode(r *http.Request, val interface{}) {

	if err := json.NewDecoder(r.Body).Decode(&val); err != nil{
		log.Println("error decoding json data: ", err)
		return 
	}
}