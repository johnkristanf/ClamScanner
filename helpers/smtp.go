package helpers

import (
	"crypto/tls"
	"fmt"
	"net/smtp"

	"crypto/rand"
	"math/big"
)

var (
	host = "smtp.gmail.com"
	port = "587"

	password = "nwmv kqis ixjg vcqs"
	from     = "jkpogz4@gmail.com"
)

func Connection() (*smtp.Client, error) {
	serverAddress := fmt.Sprintf("%s:%s", host, port)

	// Establish the initial connection
	conn, err := smtp.Dial(serverAddress)
	if err != nil {
		return nil, err
	}

	// Upgrade to TLS
	if err := conn.StartTLS(&tls.Config{ServerName: host}); err != nil {
		return nil, err
	}

	return conn, nil
}

func Disconnection(client *smtp.Client) {
	if client != nil {
		_ = client.Quit()
	}
}

func SendVerificationEmail(to string, code string) error {

	client, err := Connection()
	if err != nil {
		return err
	}

	defer Disconnection(client)


	body := fmt.Sprintf(`Dear %s,

Thank you for registering with ClamScanner App. To complete your account setup, please use the verification code below:

Verification Code: %s

Please enter this code on the verification page within the next 10 minutes to confirm your account. If you did not request this verification, please ignore this email.`, to, code)

	headers := map[string]string{
		"From":    from,
		"To":      to,
		"Subject": "ClamScanner App Verification",
	}

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r", k, v)
	}
	message += "\r" + body

	authenticate := smtp.PlainAuth("", from, password, host)

	if err := client.Auth(authenticate); err != nil {
		return err
	}

	if err := client.Mail(from); err != nil {
		return err
	}

	if err := client.Rcpt(headers["To"]); err != nil {
		return err
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}

	_, err = writer.Write([]byte(message))
	if err != nil {
		return err
	}

	if err := writer.Close(); err != nil {
		return err
	}

	return nil
}


func GenerateVerificationCode() (string, error) {
	const characters = "0123456789"
	codeLength := 6 

	var code string

	for i := 0; i < codeLength; i++ {
		randomIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(characters))))
		if err != nil {
			return "", fmt.Errorf("error generating random index: %v", err)
		}
		code += string(characters[randomIndex.Int64()])
	}

	return code, nil
}