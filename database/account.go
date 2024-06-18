package database

import (
	"time"

	"github.com/johnkristanf/clamscanner/types"
	"golang.org/x/crypto/bcrypt"
)

type AUTH_DB_METHOD interface {
	Signup(*types.SignupCredentials) error

	AdminLogin(*types.LoginCredentials) (*types.AdminData, error)
	Login(*types.LoginCredentials) (*types.UserInfo, error)

	EmailAlreadyTaken(string) error

	FetchPersonnelAccounts() ([]*types.PersonnelAccounts, error)
	DeletePersonnelAccount(int64) error
}

type User struct {
	ID        int64     `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_userID"`
	FullName  string    `gorm:"not null"`
	Address   string    `gorm:"not null"`
	Email     string    `gorm:"not null;index"`
	Password  string    `gorm:"not null"`
	Role      string    `gorm:"not null"`
	CreatedAt time.Time `gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime"`
}

func (sql *SQL) Signup(signupCredentials *types.SignupCredentials) error {

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(signupCredentials.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// readFile, err := io.ReadAll(profile)
	// if err != nil {
	// 	return err
	// }

	user := User{
		FullName:  signupCredentials.FullName,
		Address:   signupCredentials.Address,
		Email:     signupCredentials.Email,
		Password:  string(hashedPassword),
		Role:      signupCredentials.Role,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if result := sql.DB.Create(&user); result.Error != nil {
		return result.Error
	}

	return nil

}

func (sql *SQL) Login(loginCredentials *types.LoginCredentials) (userInfo *types.UserInfo, err error) {

	result := sql.DB.Select("id, full_name, address, email, password, role").Table("users").Where("email = ?", loginCredentials.Email).First(&userInfo)
	if result.Error != nil {
		return nil, result.Error
	}

	if err := bcrypt.CompareHashAndPassword([]byte(userInfo.Password), []byte(loginCredentials.Password)); err != nil {
		return nil, err
	}

	return userInfo, nil
}

func (sql *SQL) AdminLogin(loginCredentials *types.LoginCredentials) (adminData *types.AdminData, err error) {

	result := sql.DB.Select("id, email, password").Table("admins").Where("email = ?", loginCredentials.Email).First(&adminData)
	if result.Error != nil {
		return nil, result.Error
	}

	if err := bcrypt.CompareHashAndPassword([]byte(adminData.Password), []byte(loginCredentials.Password)); err != nil {
		return nil, err
	}

	return adminData, nil
}

func (sql *SQL) EmailAlreadyTaken(email string) error {

	var userInfo *types.UserInfo

	result := sql.DB.Select("id, password").Where("email = ?", email).Table("users").First(&userInfo)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (sql *SQL) FetchPersonnelAccounts() ([]*types.PersonnelAccounts, error) {

	var accounts []*types.PersonnelAccounts

	result := sql.DB.Table("users").Select("id, full_name, address, email, role").Where("role = ?", "personnel").Find(&accounts)
	if result.Error != nil {
		return nil, result.Error
	}

	return accounts, nil
}




func (sql *SQL) DeletePersonnelAccount(account_id int64) error {

	if result := sql.DB.Delete(&User{}, account_id); result.Error != nil {
		return result.Error
	}

	return nil
}
