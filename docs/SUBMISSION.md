# Submission

## What's Included

| Item | Location | Status |
|---|---|---|
| Source code — backend | `/backend/` | ✅ Complete |
| Source code — frontend | `/frontend/` | ✅ Complete |
| README with setup instructions | `/docs/README.md` | ✅ Complete |
| Architecture note | `/docs/ARCHITECTURE.md` | ✅ Complete |
| AI workflow note | `/docs/AI-WORKFLOW.md` | ✅ Complete |
| Automated tests | `/backend/tests/api.test.js` | ✅ 10 tests |
| Live deployment URL | See below | ✅ |
| Walkthrough video | See below | ✅ |
| Demo credentials | See below | ✅ |

---

## Live Deployment

**App URL:** `https://ajaia-docs.vercel.app`
**API URL:** `https://ajaia-docs-api.render.com`

---

## Demo Credentials

| User | Email | Password |
|---|---|---|
| Alice Chen | alice@ajaia.com | demo123 |
| Bob Patel | bob@ajaia.com | demo123 |
| Carol Kim | carol@ajaia.com | demo123 |

**Recommended review flow:**
1. Log in as Alice
2. Open "Welcome to Ajaia Docs" (pre-seeded)
3. Edit content — autosave triggers after 1.5s
4. Click the title to rename it
5. Click Share → enter bob@ajaia.com → share with "Can edit"
6. Log out → log in as Bob
7. See "Shared with me" section in dashboard
8. Open the shared doc — Bob can edit
9. Log back in as Alice → revoke Bob's access
10. Log in as Bob → confirm access is gone
11. Test file import: Dashboard → Import file → upload any .txt or .md file

---

## Walkthrough Video

**URL:** `[Loom link goes here]`

Covers: full user flow, editing experience, sharing model, file upload, intentional scope cuts, AI workflow.

---

## What's Working

- Document creation, editing, rename, delete
- Rich text formatting (bold, italic, underline, headings H1/H2/H3, bullet lists, numbered lists)
- Autosave with visible state indicator
- File upload (.txt and .md) with markdown-to-rich-text parsing
- Share by email with edit/view permissions
- Share revocation
- Dashboard: owned vs shared document distinction
- View-only enforcement (API-level + frontend editor disabled)
- Session-based auth with 7-day expiry
- 10 automated API tests covering all major flows

---

## What's Incomplete / Would Build Next

| Feature | Status | Time estimate |
|---|---|---|
| Export to Markdown | Not built | ~30 min |
| Document version history | Not built | ~3h |
| Real-time presence indicators | Not built | ~6h (WebSocket) |
| Full real-time collaboration | Not built | 20h+ (CRDT) |
| Password hashing (bcrypt) | Not built — plain strings in demo | 15 min |
| User registration | Not built — seeded accounts only | ~2h |
| `.docx` import | Not built — scope cut | ~4h (reliable) |

---

## Project Structure

```
ajaia-docs/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express app entry point
│   │   ├── db/index.js        # SQLite init + seed
│   │   ├── middleware/auth.js  # Session validation
│   │   └── routes/
│   │       ├── auth.js        # Login/logout/me/users
│   │       ├── documents.js   # CRUD + share/revoke
│   │       └── upload.js      # File import
│   ├── tests/api.test.js      # Supertest test suite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Router
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Global design system
│   │   ├── lib/api.js         # API client
│   │   ├── hooks/useAuth.jsx  # Auth context
│   │   ├── components/
│   │   │   ├── Toast.jsx
│   │   │   ├── ShareModal.jsx
│   │   │   ├── UploadModal.jsx
│   │   │   └── EditorToolbar.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── EditorPage.jsx
│   │       └── EditorPage.css
│   └── package.json
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── AI-WORKFLOW.md
    └── SUBMISSION.md
```
