package database

import (
	"fmt"
	"time"

	"github.com/johnkristanf/clamscanner/types"
)

type Reported_Cases struct {
	ID          int64   `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_reportedID"`
    Longitude   float32 `gorm:"not null"`
    Latitude    float32 `gorm:"not null"`
    City        string  `gorm:"index"` 
    Province    string  `gorm:"index"` 
    District    string  
    ReportedAt  string  `gorm:"not null;index"` 
    MolluskType string  `gorm:"not null"`
    Status      string  `gorm:"not null;default:In Progress"`
	
    UserID      int64   `gorm:"not null"`
}
type REPORTED_DB_METHOD interface {
	InsertReport(*types.Reported_Cases) (int64, error)

	FetchReportedCases() ([]*types.Fetch_Cases, error)
	FetchMapReportedCases(string, string, string) ([]*types.Fetch_Cases, error)
	
	FetchPerCityReports() ([]*types.YearlyReportsPerCity, error)
	FetchPerProvinceReports() ([]*types.YearlyReportsPerProvince, error)
	FetchReportsPerMollusk() ([]*types.ReportsPerMollusk, error)
	
	DeleteReportCases(int64) error
	UpdateReportStatus(int64) error
}

func (sql *SQL) InsertReport(reportCases *types.Reported_Cases) (int64, error) {

	reportedAt := time.Now().Format("January 2, 2006 03:04 PM")

	reportedCases := &Reported_Cases{
		Longitude:   reportCases.Longitude,
		Latitude:    reportCases.Latitude,
		City:        reportCases.City,
		Province:    reportCases.Province,
		District:    reportCases.District,
		ReportedAt:  reportedAt,
		MolluskType: reportCases.MolluskType,
		UserID:      reportCases.UserID,
	}

	result := sql.DB.Create(reportedCases)
	if result.Error != nil {
		return 0, result.Error
	}

	lastInsertedID := reportedCases.ID

	return lastInsertedID, nil
}


func (sql *SQL) FetchReportedCases() ([]*types.Fetch_Cases, error) {

	var cases []*types.Fetch_Cases

	result := sql.DB.Table("reported_cases").
		Select(`reported_cases.id, reported_cases.longitude, reported_cases.latitude, reported_cases.city, reported_cases.province, reported_cases.district, reported_cases.reported_at, reported_cases.mollusk_type, reported_cases.status,
		users.id AS user_id, users.full_name AS reporter_name, users.address AS reporter_address`).

		Joins("INNER JOIN users ON reported_cases.user_id = users.id").
		Order("reported_cases.id DESC").
		Find(&cases);

	if result.Error != nil {
		return nil, result.Error
	}	

	return cases, nil
}



func (sql *SQL) FetchMapReportedCases(month string, mollusk string, status string) ([]*types.Fetch_Cases, error) {

	var cases []*types.Fetch_Cases

	result := sql.DB.Table("reported_cases").
		Select(`reported_cases.id, reported_cases.longitude, reported_cases.latitude, reported_cases.city, reported_cases.province, reported_cases.district, reported_cases.reported_at, reported_cases.mollusk_type, reported_cases.status,
		users.id AS user_id, users.full_name AS reporter_name, users.address AS reporter_address`).

		Joins("INNER JOIN users ON reported_cases.user_id = users.id").
		Where("reported_at ILIKE ? AND mollusk_type = ? AND status = ?", "%"+month+"%", mollusk, status).
		Find(&cases)

	if result.Error != nil {
		return nil, result.Error
	}

	fmt.Println("cases in db: ", cases)

	return cases, nil
}



func (sql *SQL) FetchPerCityReports() ([]*types.YearlyReportsPerCity, error) {

	var yearlyReports []*types.YearlyReportsPerCity

	result := sql.DB.Table("reported_cases").
		Select(`city, EXTRACT(YEAR FROM TO_TIMESTAMP(reported_at, 'Month DD, YYYY HH:MI PM')) AS year, COUNT(id) AS reports_count`).
		Group("city, year").
		Find(&yearlyReports);

		if result.Error != nil {
			return nil, result.Error
		}	

	return yearlyReports, nil
	
}


func (sql *SQL) FetchPerProvinceReports() ([]*types.YearlyReportsPerProvince, error) {
	
	var yearlyReports []*types.YearlyReportsPerProvince

	result := sql.DB.Table("reported_cases").
		Select(`province, EXTRACT(YEAR FROM TO_TIMESTAMP(reported_at, 'Month DD, YYYY HH:MI PM')) AS year, COUNT(id) AS reports_count `).
		Group("province, year").
		Find(&yearlyReports);

		if result.Error != nil {
			return nil, result.Error
		}	
		

	return yearlyReports, nil
}


func (sql *SQL) FetchReportsPerMollusk() ([]*types.ReportsPerMollusk, error){

	var reports []*types.ReportsPerMollusk

	result := sql.DB.Table("reported_cases").
		Select("mollusk_type, COUNT(id) AS mollusk_count").
		Group("mollusk_type").
		Find(&reports)

	if result.Error != nil{
		return nil, result.Error
	}	
	
	return reports, nil
}


func (sql *SQL) DeleteReportCases(report_id int64) error {

	query := "DELETE FROM reported_cases WHERE id = ?"
	if err := sql.DB.Exec(query, report_id).Error; err != nil {
		return err
	}

	return nil
}


func (sql *SQL) UpdateReportStatus(report_id int64) error {

	result := sql.DB.Table("reported_cases").Where("id = ?", report_id).Update("status", "Resolved")
	if result.Error != nil{
		return result.Error 
	}

	return nil
}






// func stubReports(reportCases *types.Reported_Cases) (reports []*Reported_Cases) {

// 	reportedAt := time.Now().Format("January 2, 2006 03:04 PM")

// 	reportedCases := &Reported_Cases{
// 		Longitude:   reportCases.Longitude,
// 		Latitude:    reportCases.Latitude,
// 		City:        reportCases.City,
// 		Province:    reportCases.Province,
// 		District:    reportCases.District,
// 		ReportedAt:  reportedAt,
// 		MolluskType: reportCases.MolluskType,
// 		UserID:      reportCases.UserID,
// 	}

// 	reports = append(reports, reportedCases)

// 	return reports
// }

// func (sql *SQL) BulkInsertReports(batching_size int, reportCases *types.Reported_Cases) (lastInsertedIDs []int64, err error) {

// 	reports := stubReports(reportCases)
// 	tx := sql.DB.Begin()

// 	chunkList := funk.Chunk(reports, batching_size)

// 	for _, chunk := range chunkList.([][]*Reported_Cases) {
// 		valueStrings := []string{}
// 		valueArgs := []interface{}{}

// 		for _, report := range chunk {
// 			valueStrings = append(valueStrings, "(?, ?, ?, ?, ?, ?, ?, ?)")
// 			valueArgs = append(valueArgs, report.Longitude)
// 			valueArgs = append(valueArgs, report.Latitude)
// 			valueArgs = append(valueArgs, report.City)
// 			valueArgs = append(valueArgs, report.Province)
// 			valueArgs = append(valueArgs, report.District)
// 			valueArgs = append(valueArgs, report.ReportedAt)
// 			valueArgs = append(valueArgs, report.MolluskType)
// 			valueArgs = append(valueArgs, reportCases.UserID)
// 		}

// 		stmt := fmt.Sprintf("INSERT INTO reported_cases (longitude, latitude, city, province, district, reported_at, mollusk_type, user_id) VALUES %s RETURNING id", strings.Join(valueStrings, ","))

// 		rows, err := tx.Raw(stmt, valueArgs...).Rows()
// 		if err != nil {
// 			tx.Rollback()
// 			return nil, err
// 		}

// 		defer rows.Close()

// 		for rows.Next() {
// 			var lastInsertedID int64

// 			if err = rows.Scan(&lastInsertedID); err != nil {
// 				tx.Rollback()
// 				return nil, err
// 			}

// 			lastInsertedIDs = append(lastInsertedIDs, lastInsertedID)
// 		}

// 	}

// 	if err = tx.Commit().Error; err != nil {
// 		return nil, err
// 	}

// 	return lastInsertedIDs, nil
// }