const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/ajaia.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      content TEXT DEFAULT '{}',
      owner_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      shared_with_id TEXT NOT NULL,
      permission TEXT DEFAULT 'view',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(document_id, shared_with_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed demo users
  const seedUsers = [
    { id: 'user-alice', email: 'alice@ajaia.com', name: 'Alice Chen', password_hash: 'demo123' },
    { id: 'user-bob',   email: 'bob@ajaia.com',   name: 'Bob Patel',  password_hash: 'demo123' },
    { id: 'user-carol', email: 'carol@ajaia.com',  name: 'Carol Kim',  password_hash: 'demo123' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)
  `);

  for (const u of seedUsers) {
    insertUser.run(u.id, u.email, u.name, u.password_hash);
  }

  // Seed a starter document for alice
  const existingDoc = db.prepare('SELECT id FROM documents WHERE id = ?').get('doc-welcome');
  if (!existingDoc) {
    db.prepare(`
      INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)
    `).run(
      'doc-welcome',
      'Welcome to Ajaia Docs',
      JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to Ajaia Docs' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'This is a collaborative document editor. Try editing this document, creating new ones, or sharing with teammates.' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Rich text editing' }, { type: 'text', text: ' with TipTap' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'File upload' }, { type: 'text', text: ' — import .txt and .md files' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Sharing' }, { type: 'text', text: ' — share documents with teammates' }] }] },
          ]},
        ]
      }),
      'user-alice'
    );
  }
}

module.exports = { getDb };
