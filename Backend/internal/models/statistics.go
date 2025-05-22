package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Statistics struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Date      string             `bson:"date" json:"date"`
	Prize1    string             `bson:"prize1" json:"prize1"`
	First3One string             `bson:"first3_one" json:"first3_one"`
	First3Two string             `bson:"first3_two" json:"first3_two"`
	Last3One  string             `bson:"last3_one" json:"last3_one"`
	Last3Two  string             `bson:"last3_two" json:"last3_two"`
	Last2     string             `bson:"last2" json:"last2"`
}
