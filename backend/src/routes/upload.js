const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .md files are supported'));
    }
  },
});

// Convert plain text to TipTap doc JSON
function textToTipTap(text) {
  const lines = text.split('\n');
  const content = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (trimmed.startsWith('# ')) {
      content.push({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: trimmed.slice(2) }] });
    } else if (trimmed.startsWith('## ')) {
      content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: trimmed.slice(3) }] });
    } else if (trimmed.startsWith('### ')) {
      content.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: trimmed.slice(4) }] });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      content.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: trimmed.slice(2) }] }],
        }],
      });
    } else if (trimmed === '') {
      // skip empty lines or add paragraph break
    } else {
      content.push({ type: 'paragraph', content: [{ type: 'text', text: trimmed }] });
    }
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph' });
  }

  return { type: 'doc', content };
}

// POST /api/upload — upload file and create document
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const text = req.file.buffer.toString('utf-8');
  const fileName = path.basename(req.file.originalname, path.extname(req.file.originalname));
  const tiptapContent = textToTipTap(text);

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)
  `).run(id, fileName || 'Imported Document', JSON.stringify(tiptapContent), req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json({
    document: { ...doc, content: JSON.parse(doc.content) },
    message: `Imported "${req.file.originalname}" as a new document`,
  });
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
