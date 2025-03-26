package database

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type SQL struct {
	DB *gorm.DB
}

type Admin struct {
	ID        int64     `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_userID"`
	Email     string    `gorm:"not null;index"`
	Password  string    `gorm:"not null"`
	CreatedAt time.Time `gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime"`
}

func DBconfig() (*SQL, error) {

	portInt, _ := strconv.Atoi(os.Getenv("DB_PORT"))

	var (
		host     = os.Getenv("DB_HOST")
		port     = portInt
		user     = os.Getenv("DB_USER")
		password = os.Getenv("DB_PASSWORD")
		dbname   = os.Getenv("DB_NAME")
	)

	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sql, err := db.DB()
	if err != nil {
		return nil, err
	}

	sql.SetMaxOpenConns(10)
	sql.SetMaxIdleConns(5)
	sql.SetConnMaxLifetime(time.Hour * 1)
	sql.SetConnMaxIdleTime(time.Minute * 30)

	db.AutoMigrate(
		&User{}, 
		&Reported_Cases{}, 
		&Admin{}, 
		&Datasets{}, 
		&Model{}, 
		&Provinces{}, 
		&Cities{},
		&ScanLogs{},
	)

	if err := SeedAdminAccount(db); err != nil{
		return nil, err
	}

	if err := SeedProvinces(db); err != nil{
		return nil, err
	}

	if err := SeedCities(db); err != nil{
		return nil, err
	}

	return &SQL{DB: db}, nil
}


func SeedAdminAccount(db *gorm.DB) error {
	
    var admin Admin
    result := db.Where("email = ?", os.Getenv("ADMIN_EMAIL")).First(&admin)
    if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
        return result.Error
    }

    if errors.Is(result.Error, gorm.ErrRecordNotFound) {

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(os.Getenv("ADMIN_PASSWORD")), bcrypt.DefaultCost)
		if err != nil{
			return err
		}

        result := db.Create(&Admin{
            Email:      os.Getenv("ADMIN_EMAIL"),
            Password: 	string(hashedPassword), 
            CreatedAt: 	time.Now(),
            UpdatedAt: 	time.Now(),
        })

        if result.Error != nil {
            return result.Error
        }

    } 

    return nil
}


func SeedProvinces(db *gorm.DB) (err error) {
	provinces := [5]string{
		"Davao del Norte", 
		"Davao de Oro", 
		"Davao del Sur", 
		"Davao Oriental", 
		"Davao Occidental",
	}

	for _, province := range provinces {
		var existingProvince Provinces
		result := db.Where("name = ?", province).First(&existingProvince)
		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		if result.Error == gorm.ErrRecordNotFound {
			result := db.Create(&Provinces{
				Name: province,
			})
			if result.Error != nil {
				return result.Error
			}
		}
	}

	return nil
}

func SeedCities(db *gorm.DB) (err error) {
	
	cities := [6]string{
		"Panabo", 
		"Samal", 
		"Tagum", 
		"Davao", 
		"Digos", 
		"Mati",
	}

	for _, city := range cities {
		var existingProvince Cities
		result := db.Where("name = ?", city).First(&existingProvince)
		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		if result.Error == gorm.ErrRecordNotFound {
			result := db.Create(&Cities{
				Name: city,
			})

			if result.Error != nil {
				return result.Error
			}
		}
	}

	return err
}
