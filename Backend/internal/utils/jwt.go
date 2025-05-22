package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims defines the claims for JWT tokens
type CustomClaims struct {
	UserID string `json:"userId"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a new JWT token for a user
func GenerateJWT(userID, name, email, role string, rememberMe bool) (string, error) {
	// Get secret key from environment or use default for development
	secretKey := getSecretKey()
	var expiresIn time.Duration
	if rememberMe {
		expiresIn = 30 * 24 * time.Hour // 30 วัน
	} else {
		expiresIn = 24 * time.Hour // 24 ชม.
	}

	// Create claims
	claims := CustomClaims{
		UserID: userID,
		Name:   name,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret key
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT validates a JWT token and returns the claims
func ValidateJWT(tokenString string) (*CustomClaims, error) {
	// Get secret key from environment or use default for development
	secretKey := getSecretKey()

	// Parse token
	token, err := jwt.ParseWithClaims(
		tokenString,
		&CustomClaims{},
		func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secretKey), nil
		},
	)

	if err != nil {
		return nil, err
	}

	// Validate token and extract claims
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// Helper functions

// getSecretKey retrieves the JWT secret key from environment or uses a default for development
func getSecretKey() string {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		// For development only. In production, always use environment variables.
		secretKey = "your_development_secret_key_must_be_changed_in_production"
	}
	return secretKey
}

// getExpirationDuration retrieves the JWT expiration duration from environment or uses a default
func getExpirationDuration() time.Duration {
	expiresIn := os.Getenv("JWT_EXPIRATION")
	if expiresIn == "" {
		// Default to 24 hours
		return 24 * time.Hour
	}

	duration, err := time.ParseDuration(expiresIn)
	if err != nil {
		// Fall back to 24 hours if parsing fails
		return 24 * time.Hour
	}
	return duration
}
