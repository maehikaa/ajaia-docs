# Architecture Note

## Overview

Ajaia Docs is a full-stack web application with a React frontend, Express REST API backend, and SQLite persistence. The architecture is intentionally simple and reviewable — every decision prioritized clarity and fast delivery over engineering sophistication.

---

## System Diagram

```
Browser (React + TipTap)
        │
        │ HTTP (Vite proxy in dev / direct in prod)
        ▼
Express REST API (Node.js)
        │
        ├── /api/auth     → login, logout, session validation
        ├── /api/documents → CRUD + share/revoke
        └── /api/upload   → file import
        │
        ▼
SQLite (better-sqlite3)
  ┌─────────────┐
  │   users     │
  │   sessions  │
  │   documents │
  │   doc_shares│
  └─────────────┘
```

---

## Data Model

### `users`
Seeded at startup. No registration flow — demo accounts only.
- `id` (UUID), `email`, `name`, `password_hash` (plain string for demo purposes)

### `sessions`
Created on login, expire after 7 days. Passed as `x-session-id` header on every API call.
- Chose header over cookie to avoid CORS cookie complexity in a cross-origin deployment.

### `documents`
- `content` stored as JSON string (TipTap/ProseMirror document format)
- TipTap JSON is schema-aware and lossless — bold, italic, headings, lists all round-trip perfectly
- `updated_at` manually set on every PUT to enable "last edited" sorting

### `document_shares`
Join table with `(document_id, shared_with_id)` unique constraint.
- `INSERT OR REPLACE` used to handle re-sharing with different permissions atomically
- Permissions: `edit` (can read + write) or `view` (read only, enforced in both API and frontend editor)

---

## Authorization Model

Access control is enforced at the API layer on every route:

```
GET  /documents/:id   → owner OR any share entry
PUT  /documents/:id   → owner OR edit-permission share
POST /documents/:id/share   → owner only
DELETE /documents/:id/share → owner only
DELETE /documents/:id       → owner only
```

The frontend reflects these constraints (e.g., Share button only shown to owners, TipTap set to `editable: false` for view-only users), but the API enforces them independently.

---

## Editor Architecture

TipTap is built on ProseMirror and provides a React-friendly wrapper. Key choices:

- **Content format:** TipTap JSON (not HTML) — stored in the DB, loaded back directly. Avoids XSS risks of storing raw HTML and is more stable across TipTap versions than HTML serialization.
- **Autosave:** `onUpdate` callback debounced 1.5s → PUT /documents/:id. Save state shown in header (Saving... / ✓ Saved / ● Unsaved).
- **Toolbar:** Custom component using TipTap's `editor.chain().focus()` command API — clean and composable.

---

## File Upload Pipeline

```
User selects .txt or .md
        │
Multer (memory storage, 5MB limit, extension filter)
        │
textToTipTap() — line-by-line parser
  - "# Heading" → { type: 'heading', attrs: { level: 1 } }
  - "- item"    → { type: 'bulletList', ... }
  - plain text  → { type: 'paragraph', ... }
        │
INSERT into documents (owner = current user)
        │
Redirect to editor with new document ID
```

`.docx` was explicitly excluded — the `mammoth.js` library handles conversion but produces HTML, which then needs sanitization and HTML→TipTap mapping. That pipeline is reliable for simple documents but breaks on complex formatting. Chose to support only formats with predictable, parseable structure.

---

## Key Prioritization Decisions

**What I prioritized:**
1. **Editing experience quality** — TipTap gives a genuinely good editor with minimal code. Worth the dependency.
2. **Auth clarity** — Simple session token pattern is easy to follow, audit, and test. No JWT complexity.
3. **Sharing model completeness** — Owner/edit/view is a complete mental model. Implemented all three paths including revoke.
4. **Test coverage of core flows** — Auth, document CRUD, sharing lifecycle, and file upload all tested.

**What I traded off:**
- Real-time collaboration (WebSocket + CRDT is a 20+ hour problem done right)
- Fancy deployment setup (Vercel + Render is free, fast, and standard)
- Password hashing (plain strings in demo — would be bcrypt in production, noted in code comments)

---

## Deployment

**Frontend:** Vercel
- `vite build` outputs to `dist/`
- Set `VITE_API_URL=https://your-backend.render.com/api` in Vercel env vars

**Backend:** Render (free web service)
- SQLite persists to `/opt/render/project/src/backend/data/ajaia.db` (Render persistent disk)
- Set `FRONTEND_URL=https://your-app.vercel.app` in Render env vars
- Set `PORT=10000` (Render default)

**Local dev:** Vite proxy forwards `/api` → `localhost:3001` — no CORS config needed in dev.

---

## What I Would Change in Production

| Current | Production version |
|---|---|
| SQLite | Postgres (Supabase or RDS) |
| Plain password strings | bcrypt hashing |
| No rate limiting | express-rate-limit on auth routes |
| Single-process Express | PM2 or containerized with health checks |
| Seeded users only | User registration + email verification |
| In-memory Multer | S3 for file storage |
