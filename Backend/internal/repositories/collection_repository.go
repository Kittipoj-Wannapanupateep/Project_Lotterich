package repositories

import (
	"context"
	"time"

	"github.com/user/Lotterich/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CollectionRepository struct {
	collection *mongo.Collection
}

func NewCollectionRepository(db *mongo.Database) *CollectionRepository {
	return &CollectionRepository{
		collection: db.Collection("collection"),
	}
}

func (r *CollectionRepository) Create(item models.Collection) (*models.Collection, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	item.ID = primitive.NewObjectID()
	_, err := r.collection.InsertOne(ctx, item)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *CollectionRepository) FindByEmail(email string) ([]models.Collection, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := r.collection.Find(ctx, bson.M{"email": email})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var results []models.Collection
	for cursor.Next(ctx) {
		var item models.Collection
		if err := cursor.Decode(&item); err == nil {
			results = append(results, item)
		}
	}
	return results, nil
}

func (r *CollectionRepository) Update(item models.Collection) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": item.ID}, bson.M{"$set": item})
	return err
}

func (r *CollectionRepository) Delete(id primitive.ObjectID, email string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id, "email": email})
	return err
}
