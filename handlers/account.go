package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/johnkristanf/clamscanner/database"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/middlewares"
	"github.com/johnkristanf/clamscanner/types"
	"gorm.io/gorm"
)

type AccountHandler struct {
	DB_METHOD   database.AUTH_DB_METHOD
	JSON_METHOD helpers.JSON_METHODS
	JWT_METHOD  middlewares.JWT_METHOD
}

func (h *AccountHandler) SignupHandler(w http.ResponseWriter, r *http.Request) error {

	ctx, cancel := context.WithTimeout(r.Context(), time.Millisecond * 200)
	defer cancel()

	errorChan := make(chan error, 1)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return err
	}

	signupCredentials := &types.SignupCredentials{
		FullName: r.FormValue("fullname"),
		Address:  r.FormValue("address"),
		Email:    r.FormValue("email"),
		Password: r.FormValue("password"),
		Role:     r.FormValue("role"),
	}

	err := h.DB_METHOD.EmailAlreadyTaken(signupCredentials.Email)
	if err != nil {
		if err.Error() == "email_already_taken" {
			fmt.Println("The email is already taken. Please choose another one.")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Email_Taken"))
			return nil
		}

		fmt.Println("An error occurred:", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
		return nil
	}


	go func() {
		defer close(errorChan)

		if err := h.DB_METHOD.Signup(signupCredentials); err != nil {
			errorChan <- err
		}

	}()

	select {

	case <-ctx.Done():
		return fmt.Errorf("error %s : request took too long", "request timeout")

	case err := <-errorChan:
		if err != nil {
			return err
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Sign up Successfully"))

	return nil
}

type LoginResponse struct {
	UserInfo *types.UserInfo
	Error    error
}

func (h *AccountHandler) LoginHandler(w http.ResponseWriter, r *http.Request) error {

	ctx, cancel := context.WithTimeout(r.Context(), time.Millisecond * 200)
	defer cancel()

	var loginCrendentials types.LoginCredentials
	loginResponseChan := make(chan *LoginResponse)

	if err := json.NewDecoder(r.Body).Decode(&loginCrendentials); err != nil{
		return fmt.Errorf("error in json decoding %d", err)
	}

	go func() {
		defer close(loginResponseChan)

		userInfo, err := h.DB_METHOD.Login(&loginCrendentials)

		if err != nil {
			loginResponseChan <- &LoginResponse{UserInfo: nil, Error: err}
			return
		}

		loginResponseChan <- &LoginResponse{UserInfo: userInfo, Error: nil}
	}()

	select {

	case <-ctx.Done():
		return h.JSON_METHOD.JsonEncode(w, http.StatusRequestTimeout, "Request Timeout: ClamScanner took too long to respond")

	case response := <-loginResponseChan:

		userInfo, err := response.UserInfo, response.Error

		if err != nil {
			return h.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, "Invalid Username or Password")
		}

		access_token, err := h.JWT_METHOD.GenerateAccessToken(userInfo.ID, userInfo.Email, userInfo.Role)
		if err != nil {
			return err
		}

		refresh_token, err := h.JWT_METHOD.GenerateRefreshToken(userInfo.ID, userInfo.Email, userInfo.Role)
		if err != nil {
			return err
		}

		if userInfo.Role == "user" {
			return h.JSON_METHOD.JsonEncode(w, http.StatusOK, &types.SuccessLogin{
				Email:  userInfo.Email,
				UserID: userInfo.ID,
				Role:         "user",
				AccessToken:  access_token,
				RefreshToken: refresh_token,
			})
		}

		if userInfo.Role == "personnel" {
			return h.JSON_METHOD.JsonEncode(w, http.StatusOK, &types.SuccessLogin{
				Email:  userInfo.Email,
				UserID: userInfo.ID,
				Role:         "personnel",
				AccessToken:  access_token,
				RefreshToken: refresh_token,
			})
		}

	}

	return nil
}

func (h *AccountHandler) SendVerificationCodeHandler(w http.ResponseWriter, r *http.Request) error {
	var user types.ToBeVerifiedEmail

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil{
		return fmt.Errorf("error in json decoding %d", err)
	}

	code, err := helpers.GenerateVerificationCode()
	if err != nil{
		return err
	}

	if err := helpers.SendVerificationEmail(user.Email, code); err != nil{
		return err
	}

	if err := h.DB_METHOD.UpdateUserVerificationCode(user.Email, code); err != nil{
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "code_sent_successfully")
}

func (h *AccountHandler) VerifyHandler(w http.ResponseWriter, r *http.Request) error {
	var data types.VerificationCode

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil{
		return fmt.Errorf("error in json decoding %d", err)
	}

	email, err := h.DB_METHOD.CheckVerificationCode(data.VerificationCode)
	if err != nil{
		if errors.Is(err, gorm.ErrRecordNotFound){
			fmt.Println("NI GANA DIRI")
			return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "incorrect_code")
		}

		return err
	}

	if err := h.DB_METHOD.SetVerifiedUser(email); err != nil{
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "user_verification_success")

}

func (h *AccountHandler) CheckUserIfVerifiedHandler(w http.ResponseWriter, r *http.Request) error {
	var user types.ToBeVerifiedEmail

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil{
		return fmt.Errorf("error in json decoding %d", err)
	}

	verified, err := h.DB_METHOD.IsEmailVerified(user.Email)
	if err != nil{
		return err
	}

	if !verified{
		return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "user_unverified")
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "user_verified")
}

func (h *AccountHandler) AdminLoginHandler(w http.ResponseWriter, r *http.Request) error {

	var loginCrendentials types.LoginCredentials

	if err := json.NewDecoder(r.Body).Decode(&loginCrendentials); err != nil{
		return fmt.Errorf("error in json decoding %d", err)
	}

	adminData, err := h.DB_METHOD.AdminLogin(&loginCrendentials)
	if err != nil {
		return h.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, "Invalid Email or Password")
	}
	

	access_token, err := h.JWT_METHOD.GenerateAccessToken(adminData.ID, adminData.Email, "admin")
	if err != nil {
		return err
	}

	refresh_token, err := h.JWT_METHOD.GenerateRefreshToken(adminData.ID, adminData.Email, "admin")
	if err != nil {
		return err
	}

	accessTokenCookie := &http.Cookie{
		Name:     "access_token",
		Value:    access_token,
		Path:     "/",
		SameSite: http.SameSiteNoneMode,
		Expires:  time.Now().Add(3 * time.Hour),
		HttpOnly: true,
		Secure:   true,
	}

	refreshTokenCookie := &http.Cookie{
		Name:     "refresh_token",	
		Value:    refresh_token,
		Path:     "/",
		SameSite: http.SameSiteNoneMode,
		Expires:  time.Now().Add(3 * 24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
	}

	http.SetCookie(w, accessTokenCookie)
	http.SetCookie(w, refreshTokenCookie)

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Login Successfully")

}

func (h *AccountHandler) PersonnelAccountsHandler(w http.ResponseWriter, r *http.Request) error {

	accounts, err := h.DB_METHOD.FetchPersonnelAccounts()
	if err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, accounts)
}

func (h *AccountHandler) FetchAdminDataHandler(w http.ResponseWriter, r *http.Request) error {

	adminInfo := r.Context().Value(types.AdminCtxKey)

	if adminInfo != nil {

		adminData, ok := adminInfo.(*types.AdminLoginData)
		if !ok {
			return fmt.Errorf("error getting the admin payload")
		}

		return h.JSON_METHOD.JsonEncode(w, http.StatusOK, adminData)
	}

	return nil
	
}


func (h *AccountHandler) FetchAccountToEditHandler(w http.ResponseWriter, r *http.Request) error {

	idParam := r.PathValue("account_id")
	account_id, err := strconv.Atoi(idParam)
	if err != nil {
		return err
	}

	account, err := h.DB_METHOD.FetchPersonnelAccountByID(int64(account_id));
	if err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, account)
}


func (h *AccountHandler) EditPersonnelAccountHandler(w http.ResponseWriter, r *http.Request) error {

	account := &types.EditPersonnelAccountsCred{}
	if err := json.NewDecoder(r.Body).Decode(&account); err != nil{
		return fmt.Errorf("error in json decoding %d", err)
	}

	fmt.Println("EDIT ACCOUNT ENDPOINT")

	if err := h.DB_METHOD.EditPersonnelAccount(account); err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Edit Account Successfully")
}



func (h *AccountHandler) DeleteAccountHandler(w http.ResponseWriter, r *http.Request) error {

	idParam := r.PathValue("account_id")
	account_id, err := strconv.Atoi(idParam)
	if err != nil {
		return err
	}

	if err := h.DB_METHOD.DeletePersonnelAccount(int64(account_id)); err != nil {
		return err
	}

	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Account Deleted")
}


func (h *AccountHandler) SignOutHandler(w http.ResponseWriter, r *http.Request) error {

	accessTokenCookie := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		SameSite: http.SameSiteNoneMode,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
	}

	refreshTokenCookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		SameSite: http.SameSiteNoneMode,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
	}

	http.SetCookie(w, accessTokenCookie)
	http.SetCookie(w, refreshTokenCookie)


	return h.JSON_METHOD.JsonEncode(w, http.StatusOK, "Sign Out Successfully")
}
