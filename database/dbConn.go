package database

import (
	"errors"
	"fmt"
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
	var (
		host     = "localhost"
		port     = 5432
		user     = "postgres"
		password = "johntorremocha"
		dbname   = "clamscanner"
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

	if err := MigrateAdminAccount(db); err != nil{
		return nil, err
	}

	return &SQL{DB: db}, nil
}


func MigrateAdminAccount(db *gorm.DB) error {
	
    var admin Admin
    result := db.Where("email = ?", "admin@gmail.com").First(&admin)
    if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
        return result.Error
    }

    if errors.Is(result.Error, gorm.ErrRecordNotFound) {

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil{
			return err
		}

        result := db.Create(&Admin{
            Email:     "admin@gmail.com",
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

