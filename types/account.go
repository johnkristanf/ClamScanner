package types

import (
	"github.com/golang-jwt/jwt/v5"
)

type ContextKey string

const AdminCtxKey ContextKey = "adminPayload"


type SignupCredentials struct {
	FullName string `json:"fullname"`
	Address  string `json:"address"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type LoginCredentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AdminData struct {
	ID       int64  `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AdminLoginData struct{
	ID       int64  `json:"id"`
	Email    string `json:"email"`
}

type UserInfo struct {
	ID       int64
	FullName string
	Address  string
	Email    string
	Password string
	Role     string
}

type SuccessLogin struct {
	UserID		 int64 	`json:"user_id"`
	Role         string `json:"role"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type JWTPayloadClaims struct {
	ID      int64  `json:"user_id"`
	Email   string `json:"email"`
	Role    string `json:"role"`
	Expires int64  `json:"expires"`
	jwt.RegisteredClaims
}


type PersonnelAccounts struct {
	ID       int64  `json:"user_id"`
	FullName string `json:"fullname"`
	Address  string `json:"address"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}
