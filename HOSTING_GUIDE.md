# Hosting Guide for Ubuntu 24.04 Server

This guide provides step-by-step instructions for hosting the Launchpad application (Frontend + Backend) on an **Ubuntu 24.04** server using Nginx as a reverse proxy.

---

## 1. System Preparation

SSH into your Ubuntu 24 server and update the system:
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (v20 LTS)
Ubuntu 24 might have an older version by default. Use NodeSource to get the latest LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify installation:
```bash
node -v
npm -v
```

### Install Nginx
```bash
sudo apt install -y nginx
```

---

## 2. Backend Setup (Server)

1.  **Transfer Files**: Copy the project files to `/var/www/launchpad` (or your preferred directory).
    ```bash
    # Example using git
    cd /var/www
    sudo git clone <your-repo-url> launchpad
    cd launchpad/server
    ```

2.  **Install Dependencies**:
    ```bash
    sudo npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the `server` directory:
    ```bash
    sudo nano .env
    ```
    Add configuration (use a strong random secret):
    ```env
    PORT=3001
    JWT_SECRET=complex_random_string_here
    ```
    *Save (Ctrl+O) and Exit (Ctrl+X).*

4.  **Start with PM2**:
    PM2 allows the backend to run in the background and restart on reboot.
    ```bash
    sudo npm install -g pm2
    sudo pm2 start index.js --name "launchpad-api"
    sudo pm2 save
    sudo pm2 startup
    # Run the command displayed by 'pm2 startup' if asked
    ```

---

## 3. Frontend Setup (Client)

1.  **Navigate to Project Root**:
    ```bash
    cd /var/www/launchpad
    ```

2.  **Configure API URL**:
    Edit `src/lib/api.ts` to point to your domain.
    ```typescript
    // For local testing on server (tunneling) or if using Nginx proxy (recommended):
    // If you follow the Nginx config below, the API will be available at /api/
    const API_URL = 'https://yourdomain.com/api'; 
    ```

3.  **Install & Build**:
    ```bash
    sudo npm install
    sudo npm run build
    ```
    This creates a `dist` folder at `/var/www/launchpad/dist`.

4.  **Permissions**:
    Ensure Nginx can read the files:
    ```bash
    sudo chown -R www-data:www-data /var/www/launchpad
    sudo chmod -R 755 /var/www/launchpad
    ```

---

## 4. Nginx Configuration (Reverse Proxy)

Configure Nginx to serve the React frontend and proxy API requests to the Node.js backend.

1.  **Create Config File**:
    ```bash
    sudo nano /etc/nginx/sites-available/launchpad
    ```

2.  **Paste Configuration**:
    Replace `yourdomain.com` with your actual domain or server IP.

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com;

        root /var/www/launchpad/dist;
        index index.html;

        # Serve Frontend
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API Requests to Node.js Backend
        location /api/ {
            proxy_pass http://localhost:3001/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # Forward real IP to backend for logging
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```

3.  **Enable Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/launchpad /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default  # Remove default if not needed
    ```

4.  **Test & Restart Nginx**:
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## 5. Security & Final Steps

1.  **Configure Firewall (UFW)**:
    Allow SSH, HTTP, and HTTPS.
    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```

2.  **SSL/HTTPS (Recommended)**:
    Use Certbot to get a free SSL certificate.
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

3.  **Verify**:
    -   Visit `http://yourdomain.com` (or `https://` if SSL set up).
    -   Try registering/logging in to verify the API connection.
    -   Check logs if issues arise: `pm2 logs launchpad-api`.
