const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
    ssl: {
        rejectUnauthorized: false
    }
});

async function viewData() {
    try {
        console.log('--- USERS ---');
        const users = await pool.query('SELECT id, email, created_at FROM users');
        console.table(users.rows);

        console.log('\n--- SECURITY LOGS (Last 5) ---');
        const securityLogs = await pool.query('SELECT attempt_type, status, email, ip_address, created_at FROM security_audit_log ORDER BY id DESC LIMIT 5');
        console.table(securityLogs.rows);

        console.log('\n--- VISITOR LOGS (Last 5) ---');
        const visitorLogs = await pool.query('SELECT page_visited, ip_address, platform, created_at FROM visitor_audit_log ORDER BY id DESC LIMIT 5');
        console.table(visitorLogs.rows);

    } catch (err) {
        console.error('Error fetching data:', err);
    } finally {
        await pool.end();
    }
}

viewData();
