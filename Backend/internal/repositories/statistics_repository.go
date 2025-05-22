package repositories

import (
	"context"
	"errors"

	"github.com/user/Lotterich/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type StatisticsRepository struct {
	collection *mongo.Collection
}

func NewStatisticsRepository(db *mongo.Database) *StatisticsRepository {
	return &StatisticsRepository{
		collection: db.Collection("statistics"),
	}
}

func (r *StatisticsRepository) Create(ctx context.Context, stat *models.Statistics) error {
	res, err := r.collection.InsertOne(ctx, stat)
	if err != nil {
		return err
	}
	oid, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return errors.New("cannot convert to ObjectID")
	}
	stat.ID = oid
	return nil
}

func (r *StatisticsRepository) GetAll(ctx context.Context) ([]models.Statistics, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var stats []models.Statistics
	if err = cursor.All(ctx, &stats); err != nil {
		return nil, err
	}
	return stats, nil
}

func (r *StatisticsRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, map[string]interface{}{"_id": id})
	return err
}

func (r *StatisticsRepository) Update(ctx context.Context, id primitive.ObjectID, stat *models.Statistics) error {
	update := map[string]interface{}{
		"date":       stat.Date,
		"prize1":     stat.Prize1,
		"first3_one": stat.First3One,
		"first3_two": stat.First3Two,
		"last3_one":  stat.Last3One,
		"last3_two":  stat.Last3Two,
		"last2":      stat.Last2,
	}
	_, err := r.collection.UpdateOne(ctx, map[string]interface{}{"_id": id}, map[string]interface{}{"$set": update})
	return err
}
