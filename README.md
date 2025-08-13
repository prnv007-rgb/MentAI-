# MentAI-
Welcome to MentiAi a  Real-Time Quiz Platform! This is a full-stack web application that allows admins to create and host live, interactive quizzes for multiple players. It's built with a modern tech stack, featuring a Node.js backend for core logic, a Go microservice for high-performance leaderboard management, and a responsive React frontend.

The standout feature of this project is its polyglot microservice architecture, demonstrating how different technologies can be integrated to handle specific tasks efficiently. It also includes an AI-powered feature that uses the Google Gemini API to generate quiz questions from a simple prompt.
# Core Features
Dual User Roles: Separate authentication and dashboards for Admins (quiz creators) and Clients (players).

Real-Time Quiz Sessions: Admins can start a quiz, and questions are broadcast simultaneously to all connected players using WebSockets.

AI Question Generation: Admins can generate a full set of quiz questions on any topic by providing a simple text prompt to the Google Gemini API.

High-Performance Leaderboard: A dedicated Go microservice handles concurrent score updates and maintains a real-time leaderboard, ensuring speed and scalability.

Secure Authentication: User access is protected using JSON Web Tokens (JWT), with role-based access control for admin-only features.

Interactive Frontend: A clean and responsive user interface built with React provides a seamless experience for both creating and playing quizzes.

# Tech Stack & Architecture
This project uses a microservice-based architecture to separate concerns and leverage the strengths of different technologies.

# Frontend:

React (Vite): For building a fast and interactive user interface.

Axios: For handling communication with the backend API.

# Backend (Main Application):

Node.js & Express: For the core REST API, user authentication, and WebSocket server management.

MongoDB & Mongoose: As the primary database for storing users, questions, and quiz data.

WebSockets (ws): For real-time communication between the server and players.

# Microservice (Leaderboard):

Go (Golang): A high-performance, concurrent service dedicated solely to managing and serving the real-time leaderboard.

🚀 Getting Started
To run this project locally, you will need to have Node.js, Go, and MongoDB installed.

1. Backend Setup
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file in the root of the /backend folder
# and add your API keys:
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Start the Node.js server
node index.js
# Your main server will be running on http://localhost:3000

2. Go Microservice Setup
# Open a new terminal and navigate to the leaderboard directory
cd backend/leaderboard

# Run the Go service
go run main.go
# Your leaderboard service will be running on http://localhost:4000

3. Frontend Setup
# Open a third terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the React development server
npm run dev


📄 API Endpoints Overview
Authentication: /signup, /signin, /client_signup, /client_signin

Admin Actions: /create (question), /start (quiz), /generate-questions (AI)

General: /leaderboard



