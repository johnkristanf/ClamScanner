package database

import (
	"errors"
	"fmt"
	"time"

	"github.com/johnkristanf/clamscanner/types"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AUTH_DB_METHOD interface {
	Signup(*types.SignupCredentials) error

	AdminLogin(*types.LoginCredentials) (*types.AdminData, error)
	Login(*types.LoginCredentials) (*types.UserInfo, error)
	IsEmailVerified(string) (bool, error)
	UpdateUserVerificationCode(string, string) error

	CheckVerificationCode(string) (string, error)
	SetVerifiedUser(string) error

	EmailAlreadyTaken(string) error

	FetchPersonnelAccounts() ([]*types.PersonnelAccounts, error)
	FetchPersonnelAccountByID(personnelID int64) (*types.PersonnelAccounts, error)
	EditPersonnelAccount(account *types.EditPersonnelAccountsCred) error

	DeletePersonnelAccount(int64) error
}

type User struct {
	ID        		  int64     `gorm:"primaryKey;autoIncrement:true;uniqueIndex:idx_userID"`
	FullName  		  string    `gorm:"not null"`
	Address   		  string    `gorm:"not null"`
	Email     		  string    `gorm:"not null;index"`
	Password  		  string    `gorm:"not null"`
	Role      		  string    `gorm:"not null"`

	VerificationCode  string 	`gorm:"default:'RealCodeNotSet'"` 
	Status            bool      `gorm:"default:false"`

	CreatedAt 		 time.Time  `gorm:"not null;autoCreateTime"`
	UpdatedAt 		 time.Time  `gorm:"not null;autoUpdateTime"`
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

func (sql *SQL) IsEmailVerified(email string) (bool, error) {

	var user *types.EmailStatus

	result := sql.DB.Select("status").Table("users").Where("email = ?", email).First(&user)
	if result.Error != nil {
		return false, result.Error
	}

	if !user.Status{
		return false, nil
	}

	return true, nil
}


func (sql *SQL) CheckVerificationCode(code string) (string, error) {
    var user *types.ToBeVerifiedEmail

    result := sql.DB.Select("email").Table("users").Where("verification_code = ?", code).First(&user)
    if result.Error != nil {
        return "", result.Error
    }

    return user.Email, nil
}


func (sql *SQL) SetVerifiedUser(email string) error {

	result := sql.DB.Table("users").Where("email = ?", email).Update("status", true)
	if result.Error != nil{
		return result.Error
	}

	return nil
}




func (sql *SQL) UpdateUserVerificationCode(email string, code string) error {

	result := sql.DB.Table("users").Where("email = ?", email).Update("verification_code", code)

	if result.Error != nil{
		return result.Error
	}

	return nil
}

func (sql *SQL) EmailAlreadyTaken(email string) error {
	var userInfo *types.EmailTaken

	result := sql.DB.Table("users").Select("id").Where("email = ?", email).First(&userInfo)

	if result.Error == gorm.ErrRecordNotFound {
		return nil
	}

	if result.Error != nil {
		fmt.Println("Error querying the database:", result.Error)
		return result.Error
	}

	return errors.New("email_already_taken")
}

func (sql *SQL) FetchPersonnelAccounts() ([]*types.PersonnelAccounts, error) {

	var accounts []*types.PersonnelAccounts

	result := sql.DB.Table("users").Select("id, full_name, address, email, role").Where("role = ?", "personnel").Find(&accounts)
	if result.Error != nil {
		return nil, result.Error
	}

	return accounts, nil
}


func (sql *SQL) FetchPersonnelAccountByID(personnelID int64) (*types.PersonnelAccounts, error) {

	account := &types.PersonnelAccounts{}

	result := sql.DB.Table("users").
		Select("id, full_name, address, email, password").
		Where("id = ?", personnelID).
		First(&account)

	if result.Error != nil {
		return nil, result.Error
	}

	fmt.Println("account id: ", account.ID)
	fmt.Println("account full name: ", account.FullName)
	fmt.Println("account email: ", account.Email)

	return account, nil
}


func (sql *SQL) EditPersonnelAccount(account *types.EditPersonnelAccountsCred) error {

	fmt.Println("account id: ", account.ID)
	fmt.Println("account full name: ", account.FullName)
	fmt.Println("account email: ", account.Email)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(account.Password), bcrypt.DefaultCost)
		if err != nil{
			return err
		}

	updates := map[string]interface{}{
		"full_name": account.FullName,
		"address":   account.Address,
		"email":     account.Email,
		"password":  string(hashedPassword),
	}

	// Perform the update where id matches
	result := sql.DB.Table("users").Where("id = ?", account.ID).Updates(updates)

	if result.Error != nil {
		return result.Error
	}

	// Optional: check if any rows were actually updated
	if result.RowsAffected == 0 {
		return fmt.Errorf("no record found with id %d", account.ID)
	}

	return nil
}




func (sql *SQL) DeletePersonnelAccount(account_id int64) error {

	if result := sql.DB.Delete(&User{}, account_id); result.Error != nil {
		return result.Error
	}

	return nil
}
