package mock_methods

import (
	"net/http"

	"github.com/stretchr/testify/mock"
)


type MockJSONMethod struct {
	mock.Mock
}

type MockJWTMethod struct {
	mock.Mock
}

type MockRedisMethod struct {
	mock.Mock
}


// ----------------------------------- MOCK JSON METHODS --------------------------------------


func (m *MockJSONMethod) JsonEncode(w http.ResponseWriter, status int, v interface{}) error {
	args := m.Called(w, status, v)
	w.WriteHeader(status)
	return args.Error(0)
}

// ------------------------------- END OF MOCK JSON METHODS --------------------------------------



// ----------------------------------- MOCK JWT METHODS --------------------------------------

func (m *MockJWTMethod) GenerateAccessToken(user_id int64, email string, role string) (string, error) {
	args := m.Called(user_id, email, role)
	return args.String(0), args.Error(1)
}

func (m *MockJWTMethod) GenerateRefreshToken(user_id int64, email string, role string) (string, error) {
	args := m.Called(user_id, email, role)
	return args.String(0), args.Error(1)
}

func (m *MockJWTMethod) MobileAuthenticateMiddleware(next http.HandlerFunc) http.HandlerFunc {
	args := m.Called(next)
	return args.Get(0).(http.HandlerFunc)
}

func (m *MockJWTMethod) AdminAuthenticateMiddleware(next http.HandlerFunc) http.HandlerFunc {
	args := m.Called(next)
	return args.Get(0).(http.HandlerFunc)
}

// ------------------------------- END OF MOCK JWT METHODS --------------------------------------



// ----------------------------------- MOCK REDIS METHODS --------------------------------------

func (m *MockRedisMethod) SET(cachedData interface{}, cacheKey string, req *http.Request) error {
	args := m.Called(cachedData, cacheKey, req)
	return args.Error(0)
}

func (m *MockRedisMethod) GET(dest interface{}, cacheKey string, req *http.Request) error {
	args := m.Called(dest, cacheKey, req)
	return args.Error(0)
}

func (m *MockRedisMethod) DELETE(cacheKey string, req *http.Request) error {
	args := m.Called(cacheKey, req)
	return args.Error(0)
}

func (m *MockRedisMethod) DELETEBYKEY(cacheKey [5]string, req *http.Request) error {
	args := m.Called(cacheKey, req)
	return args.Error(0)
}

// ------------------------------- END OF MOCK REDIS METHODS --------------------------------------
