package types


type ModelDetails struct {
	Version        		string  	`json:"version"`
	TrainAccuracy       float32 	`json:"train_accuracy"`
	ValAccuracy         float32 	`json:"validation_accuracy"`
	TrainLoss           float32 	`json:"train_loss"`
	ValLoss             float32 	`json:"validation_loss"`
}

type Mollusk struct {
	ClassifiedMollusk string `json:"mollusk_classified_result"`
}

type MolluskDetails struct {
	Name            string  `json:"mollusk_name"`
	ScientificName	string	`json:"scientific_name"`
	Description		string	`json:"description"`
	Status          string  `json:"status"`
}

type Capture struct {
	Base64Image string `json:"captured_image"`
}

type FetchModelDetails struct {
	ID        		int64  		`json:"model_id"`
	Version         string  	`json:"version"`
	TrainAccuracy   float32 	`json:"train_acc"`
	TrainLoss       float32 	`json:"train_loss"`
	TrainedAt      string		`json:"trained_at"`
}