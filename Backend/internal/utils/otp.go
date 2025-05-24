package utils

import (
	"math/rand"
	"strconv"
	"time"
)

func GenerateOTP(length int) string {
	rand.Seed(time.Now().UnixNano())
	min := int64(1)
	for i := 1; i < length; i++ {
		min *= 10
	}
	max := min*10 - 1
	otp := rand.Int63n(max-min+1) + min
	return strconv.FormatInt(otp, 10)
}
