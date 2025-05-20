package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/user/Lotterich/internal/models"
	"github.com/user/Lotterich/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CollectionHandler struct {
	repo *repositories.CollectionRepository
}

func NewCollectionHandler(repo *repositories.CollectionRepository) *CollectionHandler {
	return &CollectionHandler{repo: repo}
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
