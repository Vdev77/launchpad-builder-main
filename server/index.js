const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the reverse proxy (Nginx) logic
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;

async function initializeDatabase() {
  try {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    console.log('Connected to SQLite database.');

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS visitor_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT,
        user_agent TEXT,
        page_visited TEXT,
        referrer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS security_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        ip_address TEXT,
        user_agent TEXT,
        attempt_type TEXT,
        status TEXT,
        failure_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Migration to add new columns if they don't exist
    const columnsToAdd = [
      'ALTER TABLE visitor_audit_log ADD COLUMN language TEXT',
      'ALTER TABLE visitor_audit_log ADD COLUMN platform TEXT',
      'ALTER TABLE visitor_audit_log ADD COLUMN screen_resolution TEXT',
      'ALTER TABLE visitor_audit_log ADD COLUMN timezone TEXT',
      'ALTER TABLE visitor_audit_log ADD COLUMN network_info TEXT',
      'ALTER TABLE security_audit_log ADD COLUMN input_details TEXT'
    ];

    for (const query of columnsToAdd) {
      try {
        await db.exec(query);
      } catch (err) {
        // Ignore error if column already exists
      }
    }

    console.log('Database schema ensured.');
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
      await db.run(
        'INSERT INTO security_audit_log (email, ip_address, user_agent, attempt_type, status, failure_reason, input_details) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      await logAttempt('failure', 'User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Insert user
    await db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);

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
      await db.run(
        'INSERT INTO security_audit_log (email, ip_address, user_agent, attempt_type, status, failure_reason, input_details) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
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
    await db.run(
      'INSERT INTO visitor_audit_log (ip_address, user_agent, page_visited, referrer, language, platform, screen_resolution, timezone, network_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
    await db.run(
      'INSERT INTO security_audit_log (email, ip_address, user_agent, attempt_type, status, failure_reason) VALUES (?, ?, ?, ?, ?, ?)',
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
