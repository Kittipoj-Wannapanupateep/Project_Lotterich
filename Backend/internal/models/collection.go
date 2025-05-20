package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Collection struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TicketNumber   string             `bson:"ticket_number" json:"ticketNumber"`
	TicketQuantity int                `bson:"ticket_quantity" json:"ticketQuantity"`
	TicketAmount   int                `bson:"ticket_amount" json:"ticketAmount"`
	Date           time.Time          `bson:"date" json:"date"`
	PrizeResult    string             `bson:"prize_result" json:"prizeResult"`
	PrizeType      string             `bson:"prize_type" json:"prizeType"`
	PrizeAmount    int                `bson:"prize_amount" json:"prizeAmount"`
	TicketWinning  string             `bson:"ticket_winning" json:"ticketWinning"`
	Email          string             `bson:"email" json:"email"`
}
