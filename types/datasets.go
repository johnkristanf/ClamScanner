package types

type NewClass struct{
	Name				string	`json:"name"`
	ScientificName		string	`json:"scientific_name"`
	Description			string	`json:"description"`
	Status				string	`json:"status"`
}


type Fetch_DatasetClass struct{
	ID 					int64 	`json:"class_id"`
	Name				string	`json:"name"`
	ScientificName		string	`json:"scientific_name"`
	Description			string	`json:"description"`
	Status				string	`json:"status"`
	Count				int		`json:"count"`
}

type EditClass struct{
	ID 					int64 	`json:"class_id"`
	ScientificName		string	`json:"scientific_name"`
	Description			string	`json:"description"`
	Status				string	`json:"status"`

}

type Train struct{
	Version		string `json:"version"`
}


