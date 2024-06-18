package types

type NewClass struct{
	Name				string	`json:"name"`
	ScientificName		string	`json:"scientific_name"`
	Description			string	`json:"description"`
	LifeCycle			string	`json:"lifecycle"`
	Status				string	`json:"status"`
}


type Fetch_DatasetClass struct{
	ID 					int64 	`json:"class_id"`
	Name				string	`json:"name"`
	ScientificName		string	`json:"scientific_name"`
	Description			string	`json:"description"`
	LifeCycle			string	`json:"lifecycle"`
	CommonlySighted		string	`json:"commonlysighted"`
	Status				string	`json:"status"`
	Count				int		`json:"count"`
}


type Train struct{
	Version		string `json:"version"`
}


