const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)
  `).run(sessionId, user.id, expiresAt);

  res.json({
    sessionId,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });

  const db = getDb();
  const session = db.prepare(`
    SELECT u.id, u.email, u.name
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId);

  if (!session) return res.status(401).json({ error: 'Invalid session' });
  res.json({ user: session });
});

// GET /api/auth/users — for share autocomplete
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, email, name FROM users').all();
  res.json({ users });
});

module.exports = router;
