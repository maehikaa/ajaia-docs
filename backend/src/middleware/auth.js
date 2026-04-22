const { getDb } = require('../db');

function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const db = getDb();
  const session = db.prepare(`
    SELECT s.*, u.id as user_id, u.email, u.name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.user = {
    id: session.user_id,
    email: session.email,
    name: session.name,
  };

  next();
}

module.exports = { requireAuth };
