# Full-Stack Web Application with React, Golang, and MongoDB

This project is a full-stack web application that demonstrates authentication and CRUD operations using:

- **Frontend**: React with Bootstrap
- **Backend**: Golang
- **Database**: MongoDB

## Project Structure

The project is divided into two main folders:

- **Frontend**: React application built with Vite
- **Backend**: Golang API server

## Features

- User authentication (login and registration)
- JWT-based authentication
- Protected routes
- CRUD operations for products
- Responsive design with Bootstrap

## Prerequisites

- Node.js (v16+)
- Go (v1.18+)
- MongoDB

## Running the Application

### Frontend

```bash
# Navigate to project root
cd /home/project

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend

```bash
# Navigate to backend directory
cd Backend

# Copy environment variables
cp .env.example .env

# Run the server
go run cmd/main.go
```

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```
PORT=8080
MONGO_URI=mongodb://localhost:27017
DB_NAME=fullstack_app
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Users

- `GET /api/users/me` - Get current user information

### Products

- `GET /api/products` - Get all products for authenticated user
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update an existing product
- `DELETE /api/products/:id` - Delete a product

## License

This project is licensed under the MIT License.# Fullstack_Lotterich
# Fullstack_Lotterich
