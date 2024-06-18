package middlewares

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/types"
)


type JWT struct{
	AccessTokenDuration   		time.Duration
	RefreshTokenDuration  		time.Duration
	AccessTokenSecret	  		string
	RefreshTokenSecret	  		string
	JSON_METHOD                 helpers.JSON_METHODS
}			

type JWT_METHOD interface{
	GenerateAccessToken(int64, string, string) (string, error)
	GenerateRefreshToken(int64, string, string) (string, error)
	MobileAuthenticateMiddleware(http.HandlerFunc) http.HandlerFunc
	AdminAuthenticateMiddleware(http.HandlerFunc) http.HandlerFunc
}

func JWT_CONFIG(accessTokenDuration time.Duration, refreshTokenDuration  time.Duration, accessTokenSecret string, refreshTokenSecret string, json helpers.JSON_METHODS) *JWT {
	return &JWT{
		AccessTokenDuration: accessTokenDuration,
		RefreshTokenDuration: refreshTokenDuration,
		AccessTokenSecret: accessTokenSecret,
		RefreshTokenSecret: refreshTokenSecret,
		JSON_METHOD: json,
	}
}




func (j JWT) GenerateAccessToken(user_id int64, email string, role string) (string, error) {

	jwt_token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user_id,
		"email":   email,
		"role":	   role,
		"expires": time.Now().Add(j.AccessTokenDuration).Unix(),  
	})

	return jwt_token.SignedString([]byte(j.AccessTokenSecret))
}




func (j JWT) GenerateRefreshToken(user_id int64, email string, role string) (string, error) {


	jwt_token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user_id,
		"email":   email,
		"role":	   role,
		"expires": time.Now().Add(j.RefreshTokenDuration).Unix(),  
	})

	return jwt_token.SignedString([]byte(j.RefreshTokenSecret))
}



func (j JWT) MobileAuthenticateMiddleware(next http.HandlerFunc) http.HandlerFunc {

	const unauthorizedMessage = "The server could not verify that you are authorized to access the document requested"

	return func(w http.ResponseWriter, r *http.Request){

		headerToken := r.Header.Get("Authorization")

		if headerToken == "" {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}


		headerParts := strings.Split(headerToken, " ")
		access_token := headerParts[1]
		authScheme := headerParts[0]

		if len(headerParts) != 2 || authScheme != "Bearer" {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}

		token, err := jwt.ParseWithClaims(access_token, &types.JWTPayloadClaims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(j.AccessTokenSecret), nil
		})


		if err != nil || !token.Valid {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}

		
		userInfo, ok := token.Claims.(*types.JWTPayloadClaims)
		if !ok {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}
		

		if time.Until(time.Unix(userInfo.Expires, 0)) < 0 {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}

		const mobileUserCtxKey types.ContextKey = "mobileUserPayload"
		ctx := context.WithValue(r.Context(), mobileUserCtxKey, userInfo)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	}
	
}

func (j JWT) AdminAuthenticateMiddleware(next http.HandlerFunc) http.HandlerFunc {
	
	const unauthorizedMessage = "You are Unauthorized to Access this Page";

	return func(w http.ResponseWriter, r *http.Request) {

		access_token, err := r.Cookie("access_token")
		if err != nil || access_token.Value == "" {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}
		

		token, err := jwt.ParseWithClaims(access_token.Value, &types.JWTPayloadClaims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(j.AccessTokenSecret), nil
		})


		if err != nil || !token.Valid {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}



		adminInfo, ok := token.Claims.(*types.JWTPayloadClaims)
		if !ok {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}
		

		if time.Until(time.Unix(adminInfo.Expires, 0)) < 0 {
			j.JSON_METHOD.JsonEncode(w, http.StatusUnauthorized, unauthorizedMessage)
			return;
		}


		adminData := &types.AdminLoginData{
			ID: adminInfo.ID,
			Email: adminInfo.Email,
		}

		ctx := context.WithValue(r.Context(), types.AdminCtxKey, adminData)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)


	}

}