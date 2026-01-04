# Launchpad Builder

This project is a full-stack web application built with **React (Vite)** for the frontend and **Node.js (Express)** with **PostgreSQL** for the backend.

## Project Structure

- **[src/](src/)**: Frontend source code (React, TypeScript, Tailwind CSS).
- **[server/](server/)**: Backend API source code (Express, PostgreSQL).
- **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)**: Comprehensive guide for hosting on Ubuntu 24.04 with Nginx.
- **[DEPLOYMENT_UPDATE.md](DEPLOYMENT.md)**: Guide for deploying updates and maintaining the production server.

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

For production deployment, please refer to the **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)**.

### Nginx Configuration (Reverse Proxy)

Here is a standard Nginx configuration to serve the frontend and proxy API requests:

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Replace with your domain/IP

    root /var/www/launchpad/dist;
    index index.html;

    # Serve Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
