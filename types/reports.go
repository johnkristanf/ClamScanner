package types

type Reported_Cases struct{
	Longitude  		float32     `json:"longitude"` 
	Latitude 	 	float32     `json:"latitude"` 
	City  		  	string 	 	`json:"city"` 
	Province  	  	string      `json:"province"` 
	District 	  	string      `json:"district"` 
	MolluskType     string 		`json:"mollusk_type"` 
	UserID     		int64 		`json:"user_id"` 
}


type Fetch_Cases struct{
	ID 				int64		`json:"report_id"` 
	Longitude  		float32     `json:"longitude"` 
	Latitude 	 	float32     `json:"latitude"` 
	City  		  	string 	 	`json:"city"` 
	Province  	  	string      `json:"province"` 
	District 	  	string      `json:"district"` 
	ReportedAt 		string 		`json:"reportedAt"` 
	MolluskType     string 		`json:"mollusk_type"`
    Status      	string  	`json:"status"`
	UserID     		int64 		`json:"user_id"` 

	ReporterName    string 		`json:"reporter_name"` 
	ReporterAddress string 		`json:"reporter_address"` 
}

type YearlyReportsPerCity struct{
	City 		string	`json:"city"` 
	Year 		string	`json:"year"` 
	ReportsCount int64	`json:"reports_count"` 

}

type YearlyReportsPerProvince struct{
	Province 		string	`json:"province"` 
	Year 			string	`json:"year"` 
	ReportsCount 	int64	`json:"reports_count"` 
}

type ReportsPerMollusk struct {
	MolluskType		string	`json:"mollusk_type"` 
	MolluskCount	int64	`json:"mollusk_count"` 
}


