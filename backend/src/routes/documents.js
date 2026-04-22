const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

// GET /api/documents — list all docs user owns or has access to
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const owned = db.prepare(`
    SELECT d.*, 'owner' as role, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  const shared = db.prepare(`
    SELECT d.*, ds.permission as role, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON d.owner_id = u.id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  res.json({ owned, shared });
});

// POST /api/documents — create new document
router.post('/', requireAuth, (req, res) => {
  const { title, content } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)
  `).run(
    id,
    title || 'Untitled Document',
    content ? JSON.stringify(content) : JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    req.user.id
  );

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json({ document: { ...doc, content: JSON.parse(doc.content) } });
});

// GET /api/documents/:id — get single document
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const userId = req.user.id;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // Check access: owner or shared
  const isOwner = doc.owner_id === userId;
  const share = db.prepare(`
    SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ?
  `).get(id, userId);

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get share list
  const shares = db.prepare(`
    SELECT u.id, u.email, u.name, ds.permission
    FROM document_shares ds
    JOIN users u ON ds.shared_with_id = u.id
    WHERE ds.document_id = ?
  `).all(id);

  const owner = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(doc.owner_id);

  res.json({
    document: {
      ...doc,
      content: JSON.parse(doc.content),
      role: isOwner ? 'owner' : share.permission,
      owner,
      shares,
    },
  });
});

// PUT /api/documents/:id — update document
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const userId = req.user.id;
  const { title, content } = req.body;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === userId;
  const share = db.prepare(`
    SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ? AND permission = 'edit'
  `).get(id, userId);

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'No edit permission' });
  }

  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (content !== undefined) { updates.push('content = ?'); values.push(JSON.stringify(content)); }
  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.json({ document: { ...updated, content: JSON.parse(updated.content) } });
});

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  res.json({ ok: true });
});

// POST /api/documents/:id/share
router.post('/:id/share', requireAuth, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { email, permission = 'edit' } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'Permission must be view or edit' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can share' });

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  db.prepare(`
    INSERT OR REPLACE INTO document_shares (id, document_id, shared_with_id, permission)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), id, targetUser.id, permission);

  res.json({
    ok: true,
    sharedWith: { id: targetUser.id, email: targetUser.email, name: targetUser.name, permission },
  });
});

// DELETE /api/documents/:id/share/:userId
router.delete('/:id/share/:userId', requireAuth, (req, res) => {
  const db = getDb();
  const { id, userId } = req.params;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can manage shares' });

  db.prepare('DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?').run(id, userId);
  res.json({ ok: true });
});

module.exports = router;
