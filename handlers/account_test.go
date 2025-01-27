package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/johnkristanf/clamscanner/types"
)

func TestSignupHandler_Success(t *testing.T) {
	// Mock the dependencies
	mockDB := new(MockDBMethod)
	mockJWT := new(MockJWTMethod)
	mockJSON := new(MockJSONMethods)

	// Setup mock return values
	mockDB.On("EmailAlreadyTaken", "test@example.com").Return(nil)
	mockDB.On("Signup", mock.Anything).Return(nil)

	// Create the handler
	handler := &AccountHandler{
		DB_METHOD:   mockDB,
		JSON_METHOD: mockJSON,
		JWT_METHOD:  mockJWT,
	}

	// Create a new HTTP request
	req := httptest.NewRequest("POST", "/signup", nil)
	req.Form = map[string][]string{
		"fullname": {"John Doe"},
		"address":  {"123 Main St"},
		"email":    {"test@example.com"},
		"password": {"password123"},
		"role":     {"user"},
	}

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler
	err := handler.SignupHandler(rr, req)

	// Assert no error and successful response
	assert.Nil(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Sign up Successfully")

	// Assert mock method calls
	mockDB.AssertExpectations(t)
}


func TestLoginHandler_Success(t *testing.T) {
	// Mock the dependencies
	mockDB := new(MockDBMethod)
	mockJWT := new(MockJWTMethod)
	mockJSON := new(MockJSONMethods)

	// Mock login response
	user := &types.UserInfo{
		ID:    1,
		Email: "test@example.com",
		Role:  "user",
	}
	mockDB.On("Login", mock.Anything).Return(user, nil)

	// Setup JWT mock methods
	mockJWT.On("GenerateAccessToken", user.ID, user.Email, user.Role).Return("access_token", nil)
	mockJWT.On("GenerateRefreshToken", user.ID, user.Email, user.Role).Return("refresh_token", nil)

	// Create the handler
	handler := &AccountHandler{
		DB_METHOD:   mockDB,
		JSON_METHOD: mockJSON,
		JWT_METHOD:  mockJWT,
	}

	// Create a login request with credentials
	loginRequest := `{"email": "test@example.com", "password": "password123"}`
	req := httptest.NewRequest("POST", "/login", nil)
	req.Body = ioutil.NopCloser(bytes.NewReader([]byte(loginRequest)))

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler
	err := handler.LoginHandler(rr, req)

	// Assert no error and successful response
	assert.Nil(t, err)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "AccessToken")
	assert.Contains(t, rr.Body.String(), "RefreshToken")

	// Assert mock method calls
	mockDB.AssertExpectations(t)
	mockJWT.AssertExpectations(t)
}
