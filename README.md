# Launchpad Builder

This project is a full-stack web application built with **React (Vite)** for the frontend and **Node.js (Express)** with **SQLite** for the backend.

## Project Structure

- **[src/](src/)**: Frontend source code (React, TypeScript, Tailwind CSS).
- **[server/](server/)**: Backend API source code (Express, SQLite).
- **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)**: Comprehensive guide for hosting on Ubuntu 24.04 with Nginx.
- **[SETUP_README.md](SETUP_README.md)**: Additional setup instructions (Note: mentions MySQL, but this project is currently configured for SQLite).

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### 1. Frontend Setup
Navigate to the root directory to install and run the frontend:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend typically runs on `http://localhost:8080` (or similar, check console output).

### 2. Backend Setup
Navigate to the server directory to install and run the backend:

```bash
cd server

# Install dependencies
npm install

# Start the server
npm start
# OR for development with auto-restart
npm run dev
```
The backend API runs on `http://localhost:3001` by default.

## Deployment

For production deployment, please refer to the **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)**. It covers:
- System preparation (Ubuntu 24.04)
- Installing Nginx and PM2
- Configuring Nginx as a reverse proxy
- SSL/HTTPS setup
