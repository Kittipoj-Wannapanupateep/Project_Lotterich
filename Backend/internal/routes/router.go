package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/user/Lotterich/internal/handlers"
	"github.com/user/Lotterich/internal/middleware"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine, authHandler *handlers.AuthHandler) {
	// API group
	api := router.Group("/api")

	// Public routes
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/users/me", authHandler.GetCurrentUser)
		protected.PATCH("/users/me", authHandler.UpdateCurrentUser)
		protected.POST("/users/change-password", authHandler.ChangePassword)
		protected.DELETE("/users/me", authHandler.DeleteAccount)
	}
}
