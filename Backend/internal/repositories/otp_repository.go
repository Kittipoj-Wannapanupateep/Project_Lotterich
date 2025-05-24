package repositories

import (
	"context"
	"strings"
	"time"

	"github.com/user/Lotterich/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OTPRepository struct {
	collection *mongo.Collection
}

func NewOTPRepository(db *mongo.Database) *OTPRepository {
	collection := db.Collection("otp")

	// Drop existing TTL index if exists
	_, err := collection.Indexes().DropOne(context.Background(), "date_otp_1")
	if err != nil && !strings.Contains(err.Error(), "ns does not exist") {
		panic(err)
	}

	// Create new TTL index on date_otp field
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "date_otp", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(180), // 3 minutes = 180 seconds
	}

	_, err = collection.Indexes().CreateOne(context.Background(), indexModel)
	if err != nil {
		panic(err)
	}

	return &OTPRepository{
		collection: collection,
	}
}

func (r *OTPRepository) CreateOrUpdate(email, otp string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	filter := bson.M{"email": email}
	update := bson.M{
		"$set": bson.M{
			"number_otp": otp,
			"date_otp":   time.Now(),
		},
	}
	_, err := r.collection.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func (r *OTPRepository) FindByEmail(email string) (*models.OTP, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	var otp models.OTP
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&otp)
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *OTPRepository) DeleteByEmail(email string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := r.collection.DeleteOne(ctx, bson.M{"email": email})
	return err
}
