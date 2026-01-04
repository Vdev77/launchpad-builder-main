# Manual Deployment Guide

Since `git` is not available or configured, you need to manually update the files on your Production Server.

## 1. Files to Upload
You must copy the following files from your local computer to your server (e.g., using FileZilla, SCP, or by copy-pasting code):

### Server Logic
*   `server/index.js`  (Contains the new PostgreSQL logic)
*   `server/package.json` (Contains the new `pg` dependency)
*   `server/.env` (Contains the Cloud Database credentials)
*   `server/ca-certificate.crt` (Contains your DigitalOcean Certificate)

### Frontend (Optional)
If you made frontend branding changes (Logo, Title):
*   `index.html`
*   `src/components/LoginCard.tsx`
*   `src/lib/api.ts`
*   *(And then rebuild the frontend on the server)*

---

## 2. Server-Side Commands
After uploading the files, SSH into your server and run these commands:

1.  **Navigate to server folder**:
    ```bash
    cd /var/www/launchpad/server
    ```

2.  **Install new dependencies** (Install `pg`, remove `sqlite3`):
    ```bash
    npm install
    ```

3.  **Restart the backend**:
    ```bash
    pm2 restart launchpad-api
    ```

4.  **Verify Status**:
    ```bash
    pm2 logs launchpad-api
    ```
    (You should see "Connected to PostgreSQL database")

---

2.  Build:
    ```bash
    npm run build
    ```

---

## 4. How to Update Specific Files in Production

If you need to update a single file (like `PhishLogs.tsx` or `index.js`) without doing a full git pull, follow these steps:

### Option A: Using Git (Recommended)
1.  **Commit & Push** your changes locally:
    ```bash
    git add .
    git commit -m "Update PhishLogs"
    git push origin main
    ```
2.  **Pull** on the server:
    ```bash
    cd /var/www/launchpad
    git pull origin main
    ```
3.  **Rebuild/Restart**:
    *   If **Frontend** changed (`src/...`):
        ```bash
        npm install  # if deps changed
        npm run build
        ```
    *   If **Backend** changed (`server/...`):
        ```bash
        cd server
        npm install # if deps changed
        pm2 restart launchpad-api
        ```

### Option B: Manual File Update (Quick Fix)
1.  **Upload** the modified file to the server (overwrite the existing one).
    *   *Frontend file location*: `/var/www/launchpad/src/...`
    *   *Backend file location*: `/var/www/launchpad/server/...`

2.  **Apply Changes**:
    *   **Frontend**: You MUST rebuild the project for the change to take effect.
        ```bash
        cd /var/www/launchpad
        npm run build
        ```
    *   **Backend**: You MUST restart the node process.
        ```bash
        pm2 restart launchpad-api
        ```
