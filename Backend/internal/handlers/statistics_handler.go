package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/user/Lotterich/internal/models"
	"github.com/user/Lotterich/internal/repositories"
	"github.com/user/Lotterich/internal/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type StatisticsHandler struct {
	repo           *repositories.StatisticsRepository
	collectionRepo *repositories.CollectionRepository
}

func NewStatisticsHandler(repo *repositories.StatisticsRepository, collectionRepo *repositories.CollectionRepository) *StatisticsHandler {
	return &StatisticsHandler{
		repo:           repo,
		collectionRepo: collectionRepo,
	}
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

	// Format date to Thai format
	date, err := time.Parse("2006-01-02", stat.Date)
	if err != nil {
		fmt.Printf("Error parsing date: %v\n", err)
		date = time.Now() // Fallback to current date if parsing fails
	}

	thaiMonths := []string{
		"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}

	thaiDate := fmt.Sprintf("%d %s %d", date.Day(), thaiMonths[date.Month()-1], date.Year()+543)

	// Send Telegram notification
	message := fmt.Sprintf("🔔 <b>งวดใหม่ถูกเพิ่มแล้ว!</b>\n\n"+
		"📅 งวดวันที่ : %s\n"+
		"🏆 รางวัลที่ 1 : %s\n"+
		"🎯 สามตัวหน้า : %s , %s\n"+
		"🎯 สามตัวท้าย : %s , %s\n"+
		"🎯 สองตัวท้าย : %s",
		thaiDate, stat.Prize1,
		stat.First3One, stat.First3Two,
		stat.Last3One, stat.Last3Two,
		stat.Last2)

	if err := utils.SendTelegramNotification(message); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to send Telegram notification: %v\n", err)
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

	// Get the statistics data before deleting to get the date
	stat, err := h.repo.GetByID(c.Request.Context(), objectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics"})
		return
	}

	// Delete the statistics
	if err := h.repo.Delete(c.Request.Context(), objectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update collection prize fields for the deleted statistics date
	if err := h.collectionRepo.UpdatePrizeFieldsByDate(c.Request.Context(), stat.Date); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update collection prize fields"})
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

func (h *StatisticsHandler) GetLatestStatistics(c *gin.Context) {
	stats, err := h.repo.GetAll(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(stats) == 0 {
		c.JSON(http.StatusOK, nil)
		return
	}

	// Sort by date in descending order and get the latest
	latestStat := stats[0]
	for _, stat := range stats {
		if stat.Date > latestStat.Date {
			latestStat = stat
		}
	}

	c.JSON(http.StatusOK, latestStat)
}

func (h *StatisticsHandler) GetAllStatisticsPublic(c *gin.Context) {
	stats, err := h.repo.GetAll(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
