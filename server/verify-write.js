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

async function verifyWrite() {
    const client = await pool.connect();
    try {
        console.log('Connected. Attempting write...');

        // 1. Insert
        const testIp = 'TEST_WRITE_' + Date.now();
        const insertRes = await client.query(
            'INSERT INTO visitor_audit_log (ip_address, page_visited, platform) VALUES ($1, $2, $3) RETURNING id',
            [testIp, '/test-write', 'DebugScript']
        );
        console.log('Insert successful! New ID:', insertRes.rows[0].id);

        // 2. Verify Read
        const readRes = await client.query('SELECT * FROM visitor_audit_log WHERE ip_address = $1', [testIp]);
        if (readRes.rows.length > 0) {
            console.log('Read verification successful found record:', readRes.rows[0]);
        } else {
            console.error('Read FAILED: Could not find the record just inserted.');
        }

    } catch (err) {
        console.error('WRITE TEST FAILED:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyWrite();
