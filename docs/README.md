# Ajaia Docs

A lightweight collaborative document editor. Create, edit, share, and import documents — built as a focused full-stack application with an intentional scope.

**Live demo:** `https://ajaia-docs.vercel.app` _(deploy URL goes here)_

---

## Demo Accounts

All accounts share password: **`demo123`**

| Name | Email | Role in demo |
|---|---|---|
| Alice Chen | alice@ajaia.com | Document owner |
| Bob Patel | bob@ajaia.com | Collaborator |
| Carol Kim | carol@ajaia.com | Collaborator |

To test sharing: log in as Alice → open a document → click Share → enter bob@ajaia.com. Then log in as Bob to see the shared document.

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone and install

```bash
git clone <repo-url>
cd ajaia-docs

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# In backend/
cp .env.example .env
# No changes needed for local dev — SQLite runs with no external dependencies
```

### 3. Run

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Starts on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

That's it. The database is auto-created at `backend/data/ajaia.db` on first run, with demo users and a starter document pre-seeded.

### 4. Run tests

```bash
cd backend
npm test
```

---

## Features

### Document editing
- Rich text editor powered by TipTap (ProseMirror)
- Formatting: Bold, Italic, Underline, Headings (H1/H2/H3), Bullet lists, Numbered lists
- Click document title to rename inline
- Autosaves 1.5s after last keystroke with visible save state indicator

### File upload
- Drag-and-drop or click-to-browse import
- Supported: `.txt` and `.md` files (up to 5MB)
- Markdown headings (`#`, `##`, `###`) and bullet lists (`-`) are parsed into rich text
- Imported file becomes a new editable document

### Sharing
- Share button visible to document owners
- Share by email with `edit` or `view` permission
- Shared users appear in the document header as avatar stack
- Owners can revoke access at any time
- Dashboard shows "My documents" vs "Shared with me" separately
- View-only users cannot edit content or title

### Persistence
- SQLite via `better-sqlite3` — no external database required
- Document content stored as TipTap JSON (formatting-preserving)
- Sessions persist across browser refresh (localStorage + DB session)

---

## File Type Support

| Format | Upload | Notes |
|---|---|---|
| `.txt` | ✅ | Plain text, each line becomes a paragraph |
| `.md` | ✅ | Headings and bullet lists parsed into rich text |
| `.docx` | ❌ | Out of scope — requires heavy parsing library |
| `.pdf` | ❌ | Out of scope |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast dev, small bundle |
| Editor | TipTap (ProseMirror) | Best rich-text DX, JSON-first |
| Routing | React Router v6 | Standard |
| Backend | Node.js + Express | Minimal, fast to write |
| Database | SQLite (better-sqlite3) | Zero-config, no external service |
| Auth | Session tokens (UUID, stored in DB) | Simple, reviewable, no JWT complexity |
| Deployment | Vercel (frontend) + Render (backend) | Free tier, fast |

---

## Intentional Scope Cuts

| Feature | Decision | Rationale |
|---|---|---|
| Real-time collaboration | Cut | Requires WebSockets + CRDT. Not achievable at quality in 4-6h |
| `.docx` upload | Cut | `mammoth.js` works but edge cases are significant — stated clearly in UI |
| Role-based permissions beyond owner/edit/view | Cut | Owner + edit + view covers the meaningful surface |
| Document version history | Cut | Storage and UI cost high; deferred to stretch |
| Email notifications on share | Cut | Requires email service integration |

---

## What I'd Build Next (with 2-4 more hours)

1. **Export to Markdown** — TipTap has a markdown serializer, this is 30 min of work
2. **Document version history** — Store snapshots on save, add a timeline UI
3. **Real-time presence indicators** — WebSocket "currently viewing" avatars without full CRDT
4. **Search** — Full-text search across document titles and content
