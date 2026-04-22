# AI Workflow Note

## Tools Used

- **Claude (Sonnet)** — primary tool throughout
- **Cursor** — code navigation and inline edits during refinement

---

## Where AI Materially Accelerated the Work

### 1. Schema and data model design
I described the sharing model in plain English and asked Claude to produce the SQLite schema including constraints, foreign keys, and the `INSERT OR REPLACE` pattern for share updates. This saved ~30 minutes of looking up SQLite-specific syntax and thinking through edge cases (e.g., the unique constraint on `(document_id, shared_with_id)` to prevent duplicate shares).

### 2. Express route boilerplate
The document CRUD routes and auth middleware followed predictable patterns. I gave Claude the schema and access control rules and had it generate the route handlers. This got me to a working API skeleton in about 20 minutes instead of 60+.

### 3. TipTap toolbar component
TipTap's `editor.chain().focus()` API is well-documented but verbose. I asked Claude to generate a toolbar covering bold, italic, underline, headings, and lists — it produced a clean implementation using the correct APIs. I verified each button against TipTap docs before accepting.

### 4. Test suite structure
I described the test scenarios (auth, CRUD, sharing lifecycle, upload) and had Claude scaffold the Supertest test file. The structure was correct; I filled in the assertions more carefully after reviewing what the API actually returned.

### 5. CSS design system
I described the aesthetic direction (warm editorial, Instrument Serif, muted ink palette) and had Claude generate the CSS variables and base utility classes. The design tokens it produced were coherent and I kept ~85% of them.

---

## What I Changed or Rejected

### Rejected: Supabase for auth
Claude initially suggested Supabase Auth for the demo. I rejected this because it would add an external dependency (requiring reviewers to configure env vars or a Supabase project) and obscure the auth logic. Replaced with plain SQLite sessions — more transparent and fully self-contained.

### Changed: File upload parsing
Claude's first `textToTipTap()` implementation tried to handle nested list indentation and inline bold/italic markdown. The output was complex and had bugs on edge cases. I simplified it to handle only top-level structure (headings, bullet lists, paragraphs) — which covers 90% of real import cases and is actually reliable.

### Rejected: JWT for sessions
Claude suggested JWT tokens for stateless auth. Rejected — JWTs add complexity (signing key management, token invalidation problem) that isn't worth it for a demo with three users. Session table in SQLite is simpler, auditable, and supports instant logout.

### Changed: Share permission enforcement
Claude's first version enforced permissions only in the frontend (disabling the editor for view-only users). I added API-level enforcement on the PUT route so view-only users cannot write even via direct API calls. This is the correct approach — frontend enforcement is UX, API enforcement is security.

### Changed: Content storage format
Claude suggested storing TipTap content as HTML. Changed to TipTap JSON — avoids XSS risks, is more stable, and loads back into the editor without any HTML parsing or sanitization step.

---

## How I Verified Correctness

- **API routes:** Ran the test suite (`npm test`) covering all major flows. Fixed two bugs found during testing — a missing `await` in the share revoke flow and an incorrect status code (200 vs 201) on document creation.
- **Editor behavior:** Manually tested every toolbar button, heading level, and list type. Verified content survived a page refresh by checking the raw DB value in the SQLite file.
- **Sharing flow:** End-to-end tested by logging in as Alice, sharing with Bob, logging in as Bob, verifying edit access works and that Bob cannot delete (owner-only action). Then verified revoke removes access immediately.
- **File upload:** Tested with a real `.md` file (this README) — headings and lists parsed correctly. Tested with `.docx` to confirm the rejection error surfaces clearly in the UI.
- **UX quality:** Walked through the full flow as a first-time user — create document, edit, rename, share, import file. Fixed the title input focus behavior (was losing focus on first click) based on that walkthrough.

---

## Honest Assessment of AI's Role

AI handled roughly 60% of the raw code output. The judgment calls — what to cut, what patterns to use, where security enforcement belongs, why JSON over HTML for storage — were mine. The places where I overrode AI suggestions were also the places most likely to cause problems in a real product. That's the right ratio.
