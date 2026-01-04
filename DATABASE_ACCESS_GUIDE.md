# How to View PostgreSQL Database Data

This guide explains how to connect to your DigitalOcean PostgreSQL database to view and manage your data on both **Windows** and **Linux**.

## Credentials
You will need the credentials found in your `server/.env` file:
*   **Host**: `db-postgresql-lon1-36964-do-user-31276311-0.i.db.ondigitalocean.com`
*   **Port**: `25060`
*   **User**: `doadmin`
*   **Password**: `AVNS_AAyJg2cs8Q0AIBqV12k`
*   **Database**: `defaultdb`
*   **SSL**: Required (Mode: `require`)

---

## Method 1: GUI Tools (Recommended for Visualizing Data)
The easiest way to view data is using a graphical tool. These work identically on Windows and Linux.

### Option A: DBeaver (Free & Powerful)
1.  **Download**: [https://dbeaver.io/download/](https://dbeaver.io/download/)
2.  **Install** and open DBeaver.
3.  Click the **"New Database Connection"** icon (plug with a +).
4.  Select **PostgreSQL**.
5.  **Main Tab**:
    *   **Host**: Paste your Host.
    *   **Port**: `25060`
    *   **Database**: `defaultdb`
    *   **Username**: `doadmin`
    *   **Password**: Paste your Password.
6.  **SSL Tab**:
    *   Check "Use SSL".
    *   **SSL Mode**: `require`.
    *   *(Optional)* If strictly required, select your `ca-certificate.crt` file for "CA Certificate".
7.  Click **"Test Connection"**, then **Finish**.
8.  Expand the connection > Databases > defaultdb > Schemas > public > Tables to see your data.

### Option B: pgAdmin 4
1.  **Download**: [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/)
2.  Create a **New Server**.
3.  **Connection Tab**: Fill in Host, Port, User, Password.
4.  **SSL Tab**: Set SSL Mode to `Require`.
5.  Save and browse "Schemas > public > Tables".

---

## Method 2: VS Code Extension
Since you are likely using VS Code, you can view data directly inside the editor.

1.  Open VS Code Extensions (`Ctrl+Shift+X`).
2.  Search for and install **"SQLTools"** and **"SQLTools PostgreSQL/Cockroach Driver"**.
3.  Click the Database icon in the sidebar.
4.  Current a new connection, select **PostgreSQL**.
5.  Fill in the form with your credentials.
6.  Connect and run queries directly in VS Code.

---

## Method 3: Command Line (CLI) - `psql`

### On Linux (Ubuntu/Debian)
1.  **Install Client**:
    ```bash
    sudo apt update
    sudo apt install postgresql-client
    ```
2.  **Connect**:
    ```bash
    psql "postgres://doadmin:AVNS_AAyJg2cs8Q0AIBqV12k@db-postgresql-lon1-36964-do-user-31276311-0.i.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    ```
3.  **Basic Commands**:
    *   `\dt` : List tables.
    *   `SELECT * FROM users;` : View users.
    *   `\q` : Quit.

### On Windows
1.  **Install**:
    *   Download the installer from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).
    *   During installation, you can uncheck "PostgreSQL Server" and "Stack Builder" if you only want the command line tools (`psql`) and pgAdmin.
2.  **Add to Path**: Ensure `C:\Program Files\PostgreSQL\<version>\bin` is in your System PATH.
3.  **Connect** (via PowerShell or CMD):
    ```powershell
    psql "postgres://doadmin:AVNS_AAyJg2cs8Q0AIBqV12k@db-postgresql-lon1-36964-do-user-31276311-0.i.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    ```
