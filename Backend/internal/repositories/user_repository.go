package repositories

import (
	"context"
	"errors"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/user/Lotterich/internal/models"
)

// UserRepository handles database operations for users
type UserRepository struct {
	collection *mongo.Collection
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *mongo.Database) *UserRepository {
	collection := db.Collection("users")
	log.Printf("Initialized UserRepository with collection: %s", collection.Name())
	return &UserRepository{
		collection: collection,
	}
}

// Create adds a new user to the database
func (r *UserRepository) Create(user models.User) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to create user with email: %s", user.Email)

	// Check if email already exists
	var existingUser models.User
	err := r.collection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		log.Printf("Email already exists: %s", user.Email)
		return nil, errors.New("email already exists")
	} else if err != mongo.ErrNoDocuments {
		log.Printf("Error checking existing email: %v", err)
		return nil, err
	}

	// Set timestamps
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	// Generate new ObjectID
	user.ID = primitive.NewObjectID()
	log.Printf("Generated new ObjectID for user: %s", user.ID.Hex())

	// Insert user
	result, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		log.Printf("Error inserting user: %v", err)
		return nil, err
	}

	log.Printf("Successfully created user with ID: %s", result.InsertedID)
	return &user, nil
}

// FindByID retrieves a user by ID
func (r *UserRepository) FindByID(id string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to find user by ID: %s", id)

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		log.Printf("Invalid ObjectID format: %v", err)
		return nil, err
	}

	var user models.User
	err = r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("User not found with ID: %s", id)
			return nil, errors.New("user not found")
		}
		log.Printf("Error finding user: %v", err)
		return nil, err
	}

	log.Printf("Successfully found user with ID: %s", id)
	return &user, nil
}

// FindByEmail retrieves a user by email
func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to find user by email: %s", email)

	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("User not found with email: %s", email)
			return nil, errors.New("user not found")
		}
		log.Printf("Error finding user: %v", err)
		return nil, err
	}

	log.Printf("Successfully found user with email: %s", email)
	return &user, nil
}

// Update modifies an existing user
func (r *UserRepository) Update(user models.User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to update user with ID: %s", user.ID.Hex())

	user.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"name":       user.Name,
			"updated_at": user.UpdatedAt,
		},
	}

	result, err := r.collection.UpdateOne(ctx, bson.M{"_id": user.ID}, update)
	if err != nil {
		log.Printf("Error updating user: %v", err)
		return err
	}

	if result.MatchedCount == 0 {
		log.Printf("No user found to update with ID: %s", user.ID.Hex())
		return errors.New("user not found")
	}

	log.Printf("Successfully updated user with ID: %s", user.ID.Hex())
	return nil
}

// UpdatePassword updates a user's password
func (r *UserRepository) UpdatePassword(userID string, newPasswordHash string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to update password for user ID: %s", userID)

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Invalid ObjectID format: %v", err)
		return err
	}

	update := bson.M{
		"$set": bson.M{
			"password_hash": newPasswordHash,
			"updated_at":    time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		log.Printf("Error updating password: %v", err)
		return err
	}

	if result.MatchedCount == 0 {
		log.Printf("No user found to update password with ID: %s", userID)
		return errors.New("user not found")
	}

	log.Printf("Successfully updated password for user ID: %s", userID)
	return nil
}

// Delete removes a user from the database
func (r *UserRepository) Delete(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to delete user with ID: %s", userID)

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Invalid ObjectID format: %v", err)
		return err
	}

	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		log.Printf("Error deleting user: %v", err)
		return err
	}

	if result.DeletedCount == 0 {
		log.Printf("No user found to delete with ID: %s", userID)
		return errors.New("user not found")
	}

	log.Printf("Successfully deleted user with ID: %s", userID)
	return nil
}
