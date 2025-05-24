package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OTP struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Email     string             `bson:"email" json:"email"`
	NumberOTP string             `bson:"number_otp" json:"number_otp"`
	DateOTP   time.Time          `bson:"date_otp" json:"date_otp"`
}
