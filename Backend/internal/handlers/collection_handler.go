package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/user/Lotterich/internal/models"
	"github.com/user/Lotterich/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CollectionHandler struct {
	repo           *repositories.CollectionRepository
	statisticsRepo *repositories.StatisticsRepository
}

func NewCollectionHandler(repo *repositories.CollectionRepository, statisticsRepo *repositories.StatisticsRepository) *CollectionHandler {
	return &CollectionHandler{repo: repo, statisticsRepo: statisticsRepo}
}

func (h *CollectionHandler) GetAll(c *gin.Context) {
	email := c.GetString("userEmail")
	items, err := h.repo.FindByEmail(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collection"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"collection": items})
}

func (h *CollectionHandler) Create(c *gin.Context) {
	email := c.GetString("userEmail")
	if email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User email not found"})
		return
	}

	var input models.Collection
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data: " + err.Error()})
		return
	}

	// Validate required fields
	if input.TicketNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ticket number is required"})
		return
	}

	if input.TicketQuantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ticket quantity must be greater than 0"})
		return
	}

	if input.TicketAmount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ticket amount must be greater than 0"})
		return
	}

	// Set email and date
	input.Email = email
	if input.Date.IsZero() {
		input.Date = time.Now()
	}

	// ตรวจรางวัลถ้ามี prize_date
	if input.PrizeDate != "" {
		// ดึงข้อมูล statistics ของงวดนั้น
		stats, err := h.statisticsRepo.GetAll(c)
		if err == nil {
			var stat *models.Statistics
			for _, s := range stats {
				if s.Date == input.PrizeDate {
					stat = &s
					break
				}
			}
			if stat != nil {
				// ตรวจสอบรางวัล
				prizeType, prizeAmount := checkPrize(input.TicketNumber, stat)
				input.PrizeType = prizeType
				input.PrizeAmount = prizeAmount
				if input.PrizeType == "" {
					input.PrizeType = "lose"
				}
			} else {
				input.PrizeType = ""
				input.PrizeAmount = 0
			}
		} else {
			input.PrizeType = ""
			input.PrizeAmount = 0
		}
	} else {
		input.PrizeType = ""
		input.PrizeAmount = 0
	}

	// Create item
	item, err := h.repo.Create(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func (h *CollectionHandler) Update(c *gin.Context) {
	email := c.GetString("userEmail")
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var input models.Collection
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = objID
	input.Email = email

	// ตรวจรางวัลถ้ามี prize_date
	if input.PrizeDate != "" {
		stats, err := h.statisticsRepo.GetAll(c)
		if err == nil {
			var stat *models.Statistics
			for _, s := range stats {
				if s.Date == input.PrizeDate {
					stat = &s
					break
				}
			}
			if stat != nil {
				prizeType, prizeAmount := checkPrize(input.TicketNumber, stat)
				input.PrizeType = prizeType
				input.PrizeAmount = prizeAmount
				if input.PrizeType == "" {
					input.PrizeType = "lose"
				}
			} else {
				input.PrizeType = ""
				input.PrizeAmount = 0
			}
		} else {
			input.PrizeType = ""
			input.PrizeAmount = 0
		}
	} else {
		input.PrizeType = ""
		input.PrizeAmount = 0
	}

	if err := h.repo.Update(input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func (h *CollectionHandler) Delete(c *gin.Context) {
	email := c.GetString("userEmail")
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := h.repo.Delete(objID, email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete item"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// checkPrize ตรวจสอบรางวัลจากเลขสลากและข้อมูลสถิติ
func checkPrize(ticketNumber string, stat *models.Statistics) (string, int) {
	// รางวัลที่ 1
	if ticketNumber == stat.Prize1 {
		return "prize1", 6000000
	}
	// ข้างเคียงรางวัลที่ 1
	if n, p := toInt(ticketNumber), toInt(stat.Prize1); n == p+1 || n == p-1 {
		return "near1", 100000
	}
	// สามตัวหน้า
	if len(ticketNumber) == 6 && (ticketNumber[:3] == stat.First3One || ticketNumber[:3] == stat.First3Two) {
		return "first3", 4000
	}
	// สามตัวท้าย
	if len(ticketNumber) == 6 && (ticketNumber[3:] == stat.Last3One || ticketNumber[3:] == stat.Last3Two) {
		return "last3", 4000
	}
	// สองตัวท้าย
	if len(ticketNumber) == 6 && ticketNumber[4:] == stat.Last2 {
		return "last2", 2000
	}
	return "", 0
}

func toInt(s string) int {
	var n int
	_, _ = fmt.Sscanf(s, "%d", &n)
	return n
}
