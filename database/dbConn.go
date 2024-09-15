package database

import (
	"errors"
	"fmt"
	"time"
	"os"
	"strconv"

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

	db.AutoMigrate(&User{}, &Reported_Cases{}, &Admin{}, &Datasets{}, &Model{})

	if err := SeedAdminAccount(db); err != nil{
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

