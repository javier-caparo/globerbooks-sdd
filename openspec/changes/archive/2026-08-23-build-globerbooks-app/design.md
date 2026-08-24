# Design: build-globerbooks-app

## Context

Empty repository; this is the first application code in the project. Source requirement: Part 1 (BRD) of `sdd-workflow_exercise.md`. Stack pinned by the architect: **Node.js + Express**, **SQLite with a simple ORM**, **React + Tailwind CSS**. The BRD mandates local storage (no cloud DB), no auth, unit tests for all business logic, and standard HTTP status codes with explicit error handling.

## Goals / Non-Goals

**Goals:**

- Layered backend (routes → services → data access) with business rules isolated in services so they are unit-testable with mocked persistence
- Single local SQLite database file; zero external services, zero secrets
- React SPA (Vite + Tailwind) served by Express in production, dev-proxied in development
- Every spec scenario in `specs/books/spec.md` traceable to at least one automated test

**Non-Goals:**

- Authentication / multi-user (BRD out-of-scope)
- Status filtering of the book list, full-text search, tags (not in BRD Part 1)
- Author bio (FR4 — deliberately deferred to the later Drift Management phase)
- Cloud deployment, containerization, CI pipelines

## Decisions

### D1 — Repository layout: `server/` + `client/` in one repo
Express app in `server/`, Vite React app in `client/`. Development: Vite dev server (5173) proxies `/api` to Express (3000). Production: `client/dist` built and served statically by Express. *Alternative:* separate repos — rejected, this is a single pilot app.

### D2 — ORM: Drizzle ORM over better-sqlite3
Constitution says "SQLite with simple ORM". Drizzle is SQL-first, lightweight, no codegen daemon, and pairs with the synchronous better-sqlite3 driver — ideal for a local single-user app. *Alternatives:* Prisma (engine binary + codegen, too heavy), Sequelize (larger legacy API), raw better-sqlite3 alone (not an ORM). *Fallback if better-sqlite3 prebuilt binaries fail on Node 26/Windows:* use Node's built-in `node:sqlite` with a thin Drizzle-compatible query layer, keeping the repository interface unchanged.

### D3 — Layering and where rules live
- `routes/` + `controllers/`: HTTP shape only — parse, validate shape, delegate, map errors
- `services/`: ALL business rules (status whitelist, completed-only rating, 1–5 integer validation, duplicate detection, rating lifecycle)
- `repositories/`: Drizzle queries only, no business logic
Business-rule unit tests target services with an in-memory/mocked repository — satisfies the BRD's "mandatory unit tests for all business logic".

### D4 — Data model (single table `books`)
| column | type | notes |
|---|---|---|
| id | TEXT PK | `crypto.randomUUID()` |
| title | TEXT NOT NULL | 1–500 chars, enforced in service + CHECK |
| author | TEXT NOT NULL | 1–200 chars |
| status | TEXT NOT NULL DEFAULT 'unread' | CHECK in (`unread`,`reading`,`completed`) |
| rating | INTEGER NULL | 1–5, only when status = completed |
| date_added | TEXT NOT NULL | ISO-8601 UTC |
| date_completed | TEXT NULL | set when status becomes `completed` |
| title_key / author_key | TEXT NOT NULL | `lower(trim(title))`, `lower(trim(author))` for duplicate lookup |

No schema migration tooling — single `CREATE TABLE` on first run (`server/src/db/init.ts`).

### D5 — Duplicate handling contract (architect clarification of BRD "flag or handle")
`POST /api/v1/books` with a case/whitespace-insensitive title+author match returns **409** with the existing book's details. The same POST with `"force": true` in the body adds anyway. Frontend maps 409 → "This book may already exist. Add anyway?" dialog.

### D6 — Rating lifecycle
Rating accepted only when `status = 'completed'` (400 `RATING_NOT_ALLOWED` otherwise; 400 `INVALID_RATING` for non-integer or out-of-range). Re-rating an already-rated completed book overwrites. **When status changes away from `completed`, the stored rating is cleared to NULL** — preserves the invariant "ratings exist only on completed books" without failing the status update.

### D7 — Error handling
Typed `AppError { code, message, httpStatus }` thrown in services; one Express error middleware maps it to `{ "error": message, "code": CODE, "timestamp": ISO-8601 }`. Codes: `INVALID_STATUS`, `INVALID_RATING`, `RATING_NOT_ALLOWED`, `VALIDATION_ERROR`, `BOOK_NOT_FOUND`, `DUPLICATE_BOOK`, `INTERNAL_ERROR`. Unknown errors → 500 with generic message (no stack leakage).

### D8 — API surface (all under `/api/v1`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/books` | list, newest first |
| POST | `/books` | add (409 duplicate; `force:true` overrides) |
| PATCH | `/books/:id/status` | update status |
| PUT | `/books/:id/rating` | set/replace rating (completed only) |
| DELETE | `/books/:id` | remove |

### D9 — Frontend shape
Vite + React function components + hooks; Tailwind for styling; a small `api.js` fetch wrapper. Components: `BookList`, `BookForm` (add), `BookRow` (status select, rating stars when completed, delete), `DuplicateDialog`. State via `useState`/`useEffect` + refetch after mutations — no state library for this size.

### D10 — Testing
Vitest everywhere (single runner for server + client). Service unit tests with mocked repository (AAA pattern). API integration tests via `supertest` against a temp SQLite file. Coverage target ≥80% on `services/`. Frontend: component smoke tests with Vitest + Testing Library (add form, duplicate dialog, rating visibility) — kept minimal, the BRD's test mandate targets business logic.

## Risks / Trade-offs

- [better-sqlite3 native bindings may lack a Node 26/Windows prebuild] → Fallback in D2 (`node:sqlite`) behind the repository interface; decided at setup task, before any feature work
- [Clearing ratings on un-complete is destructive] → Accepted trade-off to keep the invariant simple; alternative (blocking status change) rejected as worse UX for a personal tracker
- [Rating UI only when completed] → per spec; prevents most `RATING_NOT_ALLOWED` errors client-side, server still enforces
- [No auth by design] → API must not be exposed publicly; document "local use only" in README

## Migration Plan

Greenfield — nothing to migrate. Rollback = remove generated `server/`, `client/`, and the local `data/` directory; repo returns to baseline.
