package database

import (
	"time"

	"github.com/johnkristanf/clamscanner/types"
)

type Datasets struct {
	ID              int64   `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_reportedID"`
	Name            string  `gorm:"not null"`
	ScientificName  string  `gorm:"not null"`
	Description     string  `gorm:"not null"`
	Status          string  `gorm:"not null"`

	Count           int 	`gorm:"not null"`
	CreatedAt 		time.Time `gorm:"not null;autoCreateTime"`
	UpdatedAt 		time.Time `gorm:"not null;autoUpdateTime"`
}

type DATASET_DB_METHOD interface {
	AddDatasetClass(*types.NewClass) error
	FetchDatasetClasses() ([]*types.Fetch_DatasetClass, error)
	UpdateDatasetClassInfo(*types.EditClass) error
	DeleteDatasetClass(int) error
}

	
func (sql *SQL) AddDatasetClass(newClass *types.NewClass) error {


	dataset := &Datasets{
		Name: 				newClass.Name,
		ScientificName: 	newClass.ScientificName,
		Description: 		newClass.Description,
		Status: 			newClass.Status,
		Count: 				0,
	}
	 
	result := sql.DB.Create(dataset)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (sql *SQL) FetchDatasetClasses() ([]*types.Fetch_DatasetClass, error) {

	var cases []*types.Fetch_DatasetClass

	if result := sql.DB.Table("datasets").Find(&cases); result.Error != nil {
		return nil, result.Error
	}

	return cases, nil
}


// func (sql *SQL) UpdateDatasetClassImgCount(imgcount int, classID int) error {


// 	result := sql.DB.Table("datasets").Where("id = ?", classID).Update("count", imgcount)
// 	if result.Error != nil{
// 		return result.Error
// 	}

// 	return nil
// }

func (sql *SQL) UpdateDatasetClassInfo(info *types.EditClass) error {


	result := sql.DB.Table("datasets").Where("id = ?", info.ID).Updates(types.EditClass{
		ScientificName: info.ScientificName,
		Description: info.Description,
		Status: info.Status,
	})

	if result.Error != nil{
		return result.Error
	}

	return nil
}




func (sql *SQL) DeleteDatasetClass(class_id int) error {

	if result := sql.DB.Delete(&Datasets{}, class_id); result.Error != nil {
		return result.Error
	}

	return nil
}
