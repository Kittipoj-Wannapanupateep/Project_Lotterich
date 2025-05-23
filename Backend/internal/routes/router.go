package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/user/Lotterich/internal/handlers"
	"github.com/user/Lotterich/internal/middleware"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine, authHandler *handlers.AuthHandler, collectionHandler *handlers.CollectionHandler, statisticsHandler *handlers.StatisticsHandler) {
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

		// Collection routes
		protected.GET("/collection", collectionHandler.GetAll)
		protected.POST("/collection", collectionHandler.Create)
		protected.PUT("/collection/:id", collectionHandler.Update)
		protected.DELETE("/collection/:id", collectionHandler.Delete)

		// Statistics routes for regular users
		protected.GET("/statistics/latest", statisticsHandler.GetLatestStatistics)
	}

	// Admin routes
	admin := protected.Group("/admin")
	admin.Use(AdminOnly())
	{
		admin.GET("/manage", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "Welcome, admin!"})
		})
		// Statistics routes
		admin.GET("/statistics", statisticsHandler.GetAllStatistics)
		admin.POST("/statistics", statisticsHandler.CreateStatistics)
		admin.PUT("/statistics/:id", statisticsHandler.UpdateStatistics)
		admin.DELETE("/statistics/:id", statisticsHandler.DeleteStatistics)
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists || role != "admin" {
			c.JSON(403, gin.H{"error": "Admin only"})
			c.Abort()
			return
		}
		c.Next()
	}
}
