package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/johnkristanf/clamscanner/database"
	"github.com/johnkristanf/clamscanner/handlers"
	"github.com/johnkristanf/clamscanner/helpers"
	"github.com/johnkristanf/clamscanner/middlewares"
	"github.com/johnkristanf/clamscanner/routes"
	"github.com/joho/godotenv"
)


var (
	accessTokenDuration   						= 3 * time.Hour
	refreshTokenDuration  						= 3 * 24 * time.Hour
	accessTokenSecret	  						= "accessToken_secret"
	refreshTokenSecret	  						= "refreshToken_secret"
)

func main() {

	router := http.NewServeMux()

	err := godotenv.Load()
    if err != nil {
        log.Fatalf("Error loading .env file: %v", err)
    }

	db, err := database.DBconfig()
	if err != nil {
		fmt.Printf("error in db config: %v \n", err)
	}
	
	redis, err := middlewares.REDIS(os.Getenv("REDIS_URI"))
	if err != nil {
		fmt.Printf("error in redis: %v \n", err)
	}

	json := helpers.JsonConfig()
	image := helpers.ImageHelperConfig()

	jwt := middlewares.JWT_CONFIG(
		accessTokenDuration, 
		refreshTokenDuration, 
		accessTokenSecret, 
		refreshTokenSecret,
		json,
	)
	

	accountHandler := &handlers.AccountHandler{
		DB_METHOD:   db,
		JSON_METHOD: json,
		JWT_METHOD: jwt,
	}

	reportsHandler := &handlers.ReportHandler{
		DB_METHOD:   db,
		JSON_METHOD: json,
		JWT_METHOD: jwt,
		REDIS_METHOD: redis,
	}

	datasetsHandler := &handlers.DatasetsHandlers{
		DB_METHOD:   db,
		JSON_METHOD: json,
		JWT_METHOD: jwt,
		REDIS_METHOD: redis,
		IMAGE_HELPERS_METHODS: image,
	}

	modelHandler := &handlers.ModelHandlers{
		DB_METHOD:   db,
		JSON_METHOD: json,
		JWT_METHOD: jwt,
		REDIS_METHOD: redis,
	}


	routes.AccountRoutes(router, accountHandler)
	routes.ReportsRoutes(router, reportsHandler)
	routes.DatasetsRoutes(router, datasetsHandler)
	routes.ModelRoutes(router, modelHandler)

	// remove AllowCors when you push to production cause the nginx configuration 
	// is handling the cors to avoid duplication error
	
	stack := middlewares.Use(
		middlewares.Logger,
	)

	s := http.Server{
		Addr:    ":8080",
		Handler: stack(router),
	}

	log.Println("Go Server HTTPS is listening on port 8080")
	if err := s.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatal(err)
	}

}
