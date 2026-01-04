const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the reverse proxy (Nginx) logic
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
    // ca: fs.readFileSync(path.join(__dirname, 'ca-certificate.crt')).toString(),
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database.');

    try {
      // Create tables
      // PostgreSQL uses SERIAL for auto-incrementing primary keys
      // TIMESTAMP DEFAULT CURRENT_TIMESTAMP works in PG
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS visitor_audit_log (
          id SERIAL PRIMARY KEY,
          ip_address TEXT,
          user_agent TEXT,
          page_visited TEXT,
          referrer TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS security_audit_log (
          id SERIAL PRIMARY KEY,
          email TEXT,
          ip_address TEXT,
          user_agent TEXT,
          attempt_type TEXT,
          status TEXT,
          failure_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Migration to add new columns if they don't exist
      const columnsToAdd = [
        'ALTER TABLE visitor_audit_log ADD COLUMN IF NOT EXISTS language TEXT',
        'ALTER TABLE visitor_audit_log ADD COLUMN IF NOT EXISTS platform TEXT',
        'ALTER TABLE visitor_audit_log ADD COLUMN IF NOT EXISTS screen_resolution TEXT',
        'ALTER TABLE visitor_audit_log ADD COLUMN IF NOT EXISTS timezone TEXT',
        'ALTER TABLE visitor_audit_log ADD COLUMN IF NOT EXISTS network_info TEXT',
        'ALTER TABLE security_audit_log ADD COLUMN IF NOT EXISTS input_details TEXT'
      ];

      for (const query of columnsToAdd) {
        try {
          await client.query(query);
        } catch (err) {
          console.log('Column migration note:', err.message);
        }
      }

      console.log('Database schema ensured.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Helper: Get Client IP
const getClientIp = (req) => {
  // express 'trust proxy' populates req.ip correctly.
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
};

// Routes

// 1. Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const ip_address = getClientIp(req);
  const user_agent = req.headers['user-agent'] || 'unknown';

  const logAttempt = async (status, reason = null) => {
    try {
      await pool.query(
        'INSERT INTO security_audit_log (email, ip_address, user_agent, attempt_type, status, failure_reason, input_details) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [email, ip_address, user_agent, 'registration', status, reason, JSON.stringify(req.body)]
      );
    } catch (e) { console.error('Log failed', e); }
  };

  if (!email || !password) {
    await logAttempt('failure', 'Email and password required');
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check if user exists
    const existingRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRes.rows.length > 0) {
      await logAttempt('failure', 'User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Insert user
    await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);

    // Log Success
    await logAttempt('success');

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    await logAttempt('failure', 'Server error');
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const ip_address = getClientIp(req);
  const user_agent = req.headers['user-agent'] || 'unknown';

  const logAttempt = async (status, reason = null) => {
    try {
      await pool.query(
        'INSERT INTO security_audit_log (email, ip_address, user_agent, attempt_type, status, failure_reason, input_details) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [email, ip_address, user_agent, 'login', status, reason, JSON.stringify(req.body)]
      );
    } catch (e) { console.error('Log failed', e); }
  };

  if (!email || !password) {
    await logAttempt('failure', 'Email and password required');
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Find user
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    if (!user) {
      await logAttempt('failure', 'Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logAttempt('failure', 'Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Log Success
    await logAttempt('success');

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    await logAttempt('failure', 'Server error');
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 3. Log Visitor
app.post('/api/log-visitor', async (req, res) => {
  const { page_visited, referrer, language, platform, screen_resolution, timezone, network_info } = req.body;
  const ip_address = getClientIp(req);
  const user_agent = req.headers['user-agent'] || 'unknown';

  try {
    await pool.query(
      'INSERT INTO visitor_audit_log (ip_address, user_agent, page_visited, referrer, language, platform, screen_resolution, timezone, network_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [ip_address, user_agent, page_visited, referrer, language, platform, screen_resolution, timezone, network_info]
    );
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log visitor' });
  }
});

// 4. Log Security Event
app.post('/api/log-security', async (req, res) => {
  const { email, attempt_type, status, failure_reason } = req.body;
  const ip_address = getClientIp(req);
  const user_agent = req.headers['user-agent'] || 'unknown';

  try {
    await pool.query(
      'INSERT INTO security_audit_log (email, ip_address, user_agent, attempt_type, status, failure_reason) VALUES ($1, $2, $3, $4, $5, $6)',
      [email, ip_address, user_agent, attempt_type, status, failure_reason]
    );
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log security event' });
  }
});

// Start Server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
