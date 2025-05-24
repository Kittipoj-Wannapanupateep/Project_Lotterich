package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/user/Lotterich/internal/models"
	"github.com/user/Lotterich/internal/repositories"
	"github.com/user/Lotterich/internal/utils"
)

// AuthHandler handles authentication related requests
type AuthHandler struct {
	userRepo       *repositories.UserRepository
	collectionRepo *repositories.CollectionRepository
	otpRepo        *repositories.OTPRepository
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(userRepo *repositories.UserRepository, collectionRepo *repositories.CollectionRepository, otpRepo *repositories.OTPRepository) *AuthHandler {
	return &AuthHandler{
		userRepo:       userRepo,
		collectionRepo: collectionRepo,
		otpRepo:        otpRepo,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var input models.UserRegistration
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
	}
	user.Role = "user"

	createdUser, err := h.userRepo.Create(user)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    createdUser.ToResponse(),
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var input models.UserLogin
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	user, err := h.userRepo.FindByEmail(input.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate token (ส่ง input.RememberMe ไปด้วย)
	token, err := utils.GenerateJWT(user.ID.Hex(), user.Name, user.Email, user.Role, input.RememberMe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user":    user.ToResponse(),
	})
}

// GetCurrentUser retrieves the current authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	// Get user ID from JWT claims
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Find user by ID
	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user.ToResponse(),
	})
}

// UpdateCurrentUser อัพเดทชื่อผู้ใช้
func (h *AuthHandler) UpdateCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.UpdateUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	user.Name = input.Name
	if err := h.userRepo.Update(*user); err != nil {
		c.JSON(500, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(200, gin.H{"user": user.ToResponse()})
}

// ChangePassword handles password change requests
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user
	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.CurrentPassword))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	newPasswordHash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	// Update password
	if err := h.userRepo.UpdatePassword(userID.(string), string(newPasswordHash)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// DeleteAccount handles account deletion requests
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.DeleteAccountRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user
	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.CurrentPassword))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Delete all collections for this user (by email)
	if err := h.collectionRepo.DeleteByEmail(user.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user's collections"})
		return
	}

	// Delete user
	if err := h.userRepo.Delete(userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}

// POST /auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Invalid request: %v\n", err)
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}
	fmt.Printf("Processing forgot password request for email: %s\n", req.Email)

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		fmt.Printf("Email not found: %v\n", err)
		c.JSON(404, gin.H{"error": "Email not found"})
		return
	}
	fmt.Printf("User found: %s\n", user.Email)

	otp := utils.GenerateOTP(6)
	fmt.Printf("Generated OTP: %s\n", otp)

	if err := h.otpRepo.CreateOrUpdate(req.Email, otp); err != nil {
		fmt.Printf("Failed to create/update OTP: %v\n", err)
		c.JSON(500, gin.H{"error": "Failed to create OTP"})
		return
	}

	subject := "Lotterich - รหัส OTP สำหรับรีเซ็ตรหัสผ่าน"
	body := "รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ: " + otp + "\nรหัสนี้จะหมดอายุใน 3 นาที"
	if err := utils.SendEmail(req.Email, subject, body); err != nil {
		fmt.Printf("Failed to send email: %v\n", err)
		c.JSON(500, gin.H{"error": "Failed to send OTP email"})
		return
	}

	fmt.Printf("OTP sent successfully to %s\n", req.Email)
	c.JSON(200, gin.H{"message": "OTP sent"})
}

// POST /auth/verify-otp
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}
	otp, err := h.otpRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid OTP"})
		return
	}
	if otp.NumberOTP != req.OTP {
		c.JSON(400, gin.H{"error": "Invalid OTP"})
		return
	}
	if time.Since(otp.DateOTP) > 3*time.Minute {
		// ลบ OTP ที่หมดอายุ
		h.otpRepo.DeleteByEmail(req.Email)
		c.JSON(400, gin.H{"error": "OTP expired"})
		return
	}
	c.JSON(200, gin.H{"message": "OTP valid"})
}

// POST /auth/reset-password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Email       string `json:"email"`
		OTP         string `json:"otp"`
		NewPassword string `json:"newPassword"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}
	otp, err := h.otpRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid OTP"})
		return
	}
	if otp.NumberOTP != req.OTP {
		c.JSON(400, gin.H{"error": "Invalid OTP"})
		return
	}
	if time.Since(otp.DateOTP) > 3*time.Minute {
		// ลบ OTP ที่หมดอายุ
		h.otpRepo.DeleteByEmail(req.Email)
		c.JSON(400, gin.H{"error": "OTP expired"})
		return
	}
	hash, _ := utils.HashPassword(req.NewPassword)
	user, _ := h.userRepo.FindByEmail(req.Email)
	h.userRepo.UpdatePassword(user.ID.Hex(), hash)
	h.otpRepo.DeleteByEmail(req.Email)
	c.JSON(200, gin.H{"message": "Password reset successful"})
}
