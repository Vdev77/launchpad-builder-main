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

## 3. Rebuild Frontend (If needed)
If you updated the frontend code:
1.  Navigate to root:
    ```bash
    cd /var/www/launchpad
    ```
2.  Build:
    ```bash
    npm run build
    ```
