package handlers

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/Lotterich/internal/models"
	"github.com/user/Lotterich/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type StatisticsHandler struct {
	repo *repositories.StatisticsRepository
}

func NewStatisticsHandler(repo *repositories.StatisticsRepository) *StatisticsHandler {
	return &StatisticsHandler{repo: repo}
}

func (h *StatisticsHandler) CreateStatistics(c *gin.Context) {
	var stat models.Statistics
	if err := c.ShouldBindJSON(&stat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.Create(context.Background(), &stat); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stat)
}

func (h *StatisticsHandler) GetAllStatistics(c *gin.Context) {
	stats, err := h.repo.GetAll(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Debug log
	fmt.Printf("DEBUG: statistics from DB: %+v\n", stats)
	c.JSON(http.StatusOK, stats)
}

func (h *StatisticsHandler) DeleteStatistics(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}
	if err := h.repo.Delete(context.Background(), objectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Statistics deleted successfully"})
}

func (h *StatisticsHandler) UpdateStatistics(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var stat models.Statistics
	if err := c.ShouldBindJSON(&stat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.Update(context.Background(), objectID, &stat); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Statistics updated successfully"})
}
