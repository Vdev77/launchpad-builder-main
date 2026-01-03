# Setup Instructions

## Prerequisites
1.  **Node.js**: Install from [nodejs.org](https://nodejs.org/).
2.  **MySQL**: Install MySQL Server and ensure it is running.

## 1. Database Setup
1.  Create a database named `launchpad_db`.
2.  Import the schema:
    - If you have command line access: `mysql -u root -p launchpad_db < server/schema.sql`
    - Or copy the content of `server/schema.sql` and run it in your MySQL GUI (Workbench, phpMyAdmin, etc).

## 2. Backend Server
1.  Open terminal in `server` folder: `cd server`
2.  Install dependencies: `npm install`
3.  Start server: `npm start`
    - Server runs on `http://localhost:3001`

## 3. Frontend Application
1.  Open a new terminal in the project root.
2.  Install dependencies: `npm install` (or `bun install`)
3.  Start the app: `npm run dev`

## Troubleshooting
- **Database Connection Error**: Check `server/.env`. Update `DB_PASSWORD` to match your MySQL root password.
- **CORS Error**: Ensure both server (port 3001) and frontend (port 8080/5173) are running.
