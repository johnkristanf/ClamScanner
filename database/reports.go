package database

import (
	"fmt"
	"strings"
	"sync"

	"github.com/johnkristanf/clamscanner/types"
	"gorm.io/gorm"
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

type ScanLogs struct {
	ID          int64  `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_reportedID" json:"id"`
	Address     string `gorm:"index" json:"address"`
	MolluskType string `gorm:"not null" json:"mollusk_type"`
	UserID      int64  `gorm:"not null" json:"user_id"`
	ReportedAt  string `gorm:"not null;index" json:"reported_at"`
}


type Provinces struct {
	ID          int64   `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_reportedID"`
	Name        string  `gorm:"not null"`
	Count       int64   `gorm:"not null;default:0"`  
}

type Cities struct {
	ID          int64   `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_reportedID"`
	Name        string  `gorm:"not null"`
	Count       int64   `gorm:"not null;default:0"`  
}


type REPORTED_DB_METHOD interface {
	InsertReport(*types.Reported_Cases) (int64, error)
	InsertScanLogs(*ScanLogs) (error)

	FetchReportedCases() ([]*types.Fetch_Cases, error)
	FetchMapReportedCases(string, string, string) ([]*types.Fetch_Cases, error)
	
	FetchScanLogs() ([]*types.ScanLogUserDetails, error)
	FetchReportsData() ([]*types.Fetch_Cases, error)

	FetchPerCityReports() ([]*types.ReportsPerCity, error)
	FetchPerProvinceReports() ([]*types.ReportsPerProvince, error)
	FetchReportsPerMollusk() ([]*types.ReportsPerMollusk, error)
	FetchReportsPerYear() ([]*types.ReportsPerYear, error)
	FetchResolvedReportsPerYear() ([]*types.ReportsPerYear, error)
	
	DeleteReportCases(int64, string, string, string) error
	UpdateReportStatus(int64) error
}

func (sql *SQL) InsertReport(reportCases *types.Reported_Cases) (int64, error) {

	reportedCases := &Reported_Cases{
		Longitude:   reportCases.Longitude,
		Latitude:    reportCases.Latitude,
		City:        reportCases.City,
		Province:    reportCases.Province,
		District:    reportCases.District,
		ReportedAt:  reportCases.ReportAt,
		MolluskType: reportCases.MolluskType,
		UserID:      reportCases.UserID,
	}

	result := sql.DB.Create(reportedCases)
	if result.Error != nil {
		return 0, result.Error
	}

	lastInsertedID := reportedCases.ID


	var wg sync.WaitGroup
	errChan := make(chan error, 3)

	wg.Add(1) 
	go func() {
		defer wg.Done() 
		if err := UpdateProvincesCount(sql.DB, reportedCases.Province);  err != nil {
			errChan <- fmt.Errorf("error updating provinces count: %w", err)
		}
	}()


	wg.Add(1) 
	go func() {
		defer wg.Done() 
		if err := UpdateCitiesCount(sql.DB, reportedCases.City); err != nil {
			errChan <- fmt.Errorf("error updating cities count: %w", err) 
		}
	}()

	wg.Add(1) 
	go func() {
		defer wg.Done() 
		if err := UpdateMolluskReportCount(sql.DB, reportedCases.MolluskType); err != nil {
			errChan <- fmt.Errorf("error updating mollusk datasets count: %w", err) 
		}
	}()

	wg.Wait()

	var errs []error
	for i := 0; i < 3; i++ {
		if err := <-errChan; err != nil {
			errs = append(errs, err) 
		}
	}

	close(errChan)

	if len(errs) > 0 {
		return 0, fmt.Errorf("errors in updating provinces and cities occurred: %v", errs)
	}

	return lastInsertedID, nil
}

func (sql *SQL) InsertScanLogs(scanLogsData *ScanLogs) (error) {
	result := sql.DB.Create(scanLogsData)
	if result.Error != nil {
		return result.Error
	}

	return nil
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

	query := sql.DB.Table("reported_cases").
		Select(`reported_cases.id, reported_cases.longitude, reported_cases.latitude, reported_cases.city, reported_cases.province, reported_cases.district, reported_cases.reported_at, reported_cases.mollusk_type, reported_cases.status,
		users.id AS user_id, users.full_name AS reporter_name, users.address AS reporter_address`).
		Joins("INNER JOIN users ON reported_cases.user_id = users.id")

	conditions := []string{}
	values := []interface{}{}

	if month != "All" {
		conditions = append(conditions, "reported_cases.reported_at ILIKE ?")
		values = append(values, "%"+month+"%")
	}

	if mollusk != "All" {
		conditions = append(conditions, "reported_cases.mollusk_type = ?")
		values = append(values, mollusk)
	}

	if status != "All" {
		conditions = append(conditions, "reported_cases.status = ?")
		values = append(values, status)
	}

	if len(conditions) > 0 {
		query = query.Where(strings.Join(conditions, " AND "), values...)
	}

	query = query.Find(&cases)

	if query.Error != nil {
		return nil, query.Error 
	}

	fmt.Println("cases in db: ", cases)

	return cases, nil

}


func (sql *SQL) FetchReportsData() ([]*types.Fetch_Cases, error) {

	var cases []*types.Fetch_Cases

	query := sql.DB.Table("reported_cases").
		Select(`reported_cases.id, reported_cases.longitude, reported_cases.latitude, reported_cases.city, reported_cases.province, reported_cases.district, reported_cases.reported_at, reported_cases.mollusk_type, reported_cases.status,
		users.id AS user_id, users.full_name AS reporter_name, users.address AS reporter_address`).
		Joins("INNER JOIN users ON reported_cases.user_id = users.id")

	query = query.Find(&cases)

	if query.Error != nil {
		return nil, query.Error 
	}

	fmt.Println("cases in db: ", cases)

	return cases, nil

}


func (sql *SQL) FetchPerCityReports() ([]*types.ReportsPerCity, error) {
	
	var reports []*types.ReportsPerCity

	result := sql.DB.Table("cities").Select(`name, count`).Order("count DESC").Find(&reports);

	if result.Error != nil {
		return nil, result.Error
	}	

	return reports, nil
}


func (sql *SQL) FetchScanLogs() ([]*types.ScanLogUserDetails, error) {
	
	var scanLogs []*types.ScanLogUserDetails

	result := sql.DB.Table("scan_logs").
		Select(`users.full_name, users.email, scan_logs.id, scan_logs.address, scan_logs.mollusk_type, scan_logs.reported_at`).
		Joins("INNER JOIN users ON scan_logs.user_id = users.id").
		Order("scan_logs.id DESC").
		Find(&scanLogs);

	if result.Error != nil {
		return nil, result.Error
	}	

	return scanLogs, nil
}

func (sql *SQL) FetchPerProvinceReports() ([]*types.ReportsPerProvince, error) {
	
	var reports []*types.ReportsPerProvince

	result := sql.DB.Table("provinces").Select(`name, count`).Order("count DESC").Find(&reports);

	if result.Error != nil {
		return nil, result.Error
	}	

	return reports, nil
}

func (sql *SQL) FetchReportsPerMollusk() ([]*types.ReportsPerMollusk, error){

	var reports []*types.ReportsPerMollusk

	result := sql.DB.Table("datasets").
		Select("name, report_count").
		Where("status", "Endangered").
		Order("report_count DESC").
		Find(&reports)

	if result.Error != nil{
		return nil, result.Error
	}	
	
	return reports, nil
}


func (sql *SQL) FetchReportsPerYear() ([]*types.ReportsPerYear, error){

	var reports []*types.ReportsPerYear

	result := sql.DB.Table("reported_cases").
		Select("EXTRACT(YEAR FROM TO_TIMESTAMP(reported_at, 'Month DD, YYYY HH:MI PM')) AS year, COUNT(id) AS count"). 
		Group("year").
		Order("count DESC").
		Find(&reports)

	if result.Error != nil{
		return nil, result.Error
	}	
	
	return reports, nil
}


func (sql *SQL) FetchResolvedReportsPerYear() ([]*types.ReportsPerYear, error){

	var reports []*types.ReportsPerYear

	result := sql.DB.Table("reported_cases").
		Select("EXTRACT(YEAR FROM TO_TIMESTAMP(reported_at, 'Month DD, YYYY HH:MI PM')) AS year, COUNT(id) AS count"). 
		Where("status = ?", "Resolved").
		Group("year").
		Order("count DESC").
		Find(&reports)

	if result.Error != nil{
		return nil, result.Error
	}	
	
	return reports, nil
}




// func (sql *SQL) FetchPerCityReports() ([]*types.YearlyReportsPerCity, error) {

// 	var yearlyReports []*types.YearlyReportsPerCity

// 	result := sql.DB.Table("reported_cases").
// 		Select(`city, EXTRACT(YEAR FROM TO_TIMESTAMP(reported_at, 'Month DD, YYYY HH:MI PM')) AS year, COUNT(id) AS reports_count`).
// 		Group("city, year").
// 		Find(&yearlyReports);

// 		if result.Error != nil {
// 			return nil, result.Error
// 		}	

// 	return yearlyReports, nil
	
// }


// func (sql *SQL) FetchPerProvinceReports() ([]*types.YearlyReportsPerProvince, error) {
	
// 	var yearlyReports []*types.YearlyReportsPerProvince

// 	result := sql.DB.Table("reported_cases").
// 		Select(`province, EXTRACT(YEAR FROM TO_TIMESTAMP(reported_at, 'Month DD, YYYY HH:MI PM')) AS year, COUNT(id) AS reports_count `).
// 		Group("province, year").
// 		Find(&yearlyReports);

// 		if result.Error != nil {
// 			return nil, result.Error
// 		}	
		

// 	return yearlyReports, nil
// }


// func (sql *SQL) FetchReportsPerMollusk() ([]*types.ReportsPerMollusk, error){

// 	var reports []*types.ReportsPerMollusk

// 	result := sql.DB.Table("reported_cases").
// 		Select("mollusk_type, COUNT(id) AS mollusk_count").
// 		Group("mollusk_type").
// 		Find(&reports)

// 	if result.Error != nil{
// 		return nil, result.Error
// 	}	
	
// 	return reports, nil
// }



func (sql *SQL) DeleteReportCases(report_id int64, province string, city string, molluskName string) error {

	query := "DELETE FROM reported_cases WHERE id = ?"
	if err := sql.DB.Exec(query, report_id).Error; err != nil {
		return err
	}

	if err := DecrementProvincesCount(sql.DB, province); err != nil{
		return err
	}

	if err := DecrementCitiesCount(sql.DB, city); err != nil{
		return err
	}

	if err := DecrementMolluskReportCount(sql.DB, molluskName); err != nil{
		return err
	}

	return nil
}


func DecrementProvincesCount(DB *gorm.DB, province string) error {

	query := "UPDATE provinces SET count = count - 1 WHERE name = ?"
	if err := DB.Exec(query, province).Error; err != nil {
		return err
	}

	return nil
}


func DecrementCitiesCount(DB *gorm.DB, city string) error {

	query := "UPDATE cities SET count = count - 1 WHERE name = ?"
	if err := DB.Exec(query, city).Error; err != nil {
		return err
	}

	return nil
}


func DecrementMolluskReportCount(DB *gorm.DB, molluskName string) error {

	query := "UPDATE datasets SET report_count = report_count - 1 WHERE name = ?"
	if err := DB.Exec(query, molluskName).Error; err != nil {
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


func UpdateProvincesCount(DB *gorm.DB, province string) error {

	query := "UPDATE provinces SET count = count + 1 WHERE name = ?"
	if err := DB.Exec(query, province).Error; err != nil {
		return err
	}

	return nil
}


func UpdateCitiesCount(DB *gorm.DB, city string) error {

	query := "UPDATE cities SET count = count + 1 WHERE name = ?"
	if err := DB.Exec(query, city).Error; err != nil {
		return err
	}

	return nil
}


func UpdateMolluskReportCount(DB *gorm.DB, molluskName string) error {

	query := "UPDATE datasets SET report_count = report_count + 1 WHERE name = ?"
	if err := DB.Exec(query, molluskName).Error; err != nil {
		return err
	}

	return nil
}

