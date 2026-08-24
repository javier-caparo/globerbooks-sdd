# Proposal: build-globerbooks-app

## Why

GloberBooks is a pilot initiative to validate a Spec-Driven Development (SDD) workflow with Human-in-the-Loop oversight, replacing ad-hoc "vibe coding" with spec-first development. The concrete deliverable solves a real personal need: readers lack a simple tool to track books they want to read, are reading, and have completed.

## What Changes

This is a greenfield build. It creates:

- A lightweight RESTful API managing a personal book collection (add / list / update / remove books)
- Status tracking per book: `unread`, `reading`, `completed`
- A rating system: integer 1–5, restricted to books marked `completed`
- Duplicate detection on add (title + author), surfaced to the user with override option
- A React + Tailwind CSS frontend to manage the collection
- Unit tests for all business logic (rating integrity, status validation, duplicate handling)

Out of scope (per BRD §2): user authentication/multi-user support, cloud-hosted databases (local SQLite file storage instead), third-party API integrations for book metadata, and FR4 Author Bio (deliberately deferred to a later Drift Management phase).

## Capabilities

### New Capabilities

- `books`: Personal book collection management — CRUD operations, status tracking (`unread` / `reading` / `completed`), completed-only rating (1–5 integers), and duplicate flagging, exposed via a REST API and a React + Tailwind frontend.

### Modified Capabilities

(none — no existing specs; this is the first capability in the repo)

## Impact

- **New code**: entire application — Express API server (layered: routes → services → data access), SQLite persistence via a lightweight ORM, React frontend, and test suites.
- **Dependencies**: Node.js + Express; SQLite ORM (e.g., better-sqlite3 + a thin data-access layer or a small ORM); React + Vite + Tailwind CSS; a test runner (e.g., Vitest/Jest). No secrets or credentials required — all storage is local.
- **APIs**: new public REST endpoints under `/api/v1/books` (exact contract defined in the `books` spec delta).
- **Business rules enforced**: rating only for `completed` books; ratings integer 1–5; duplicates flagged; standard HTTP status codes with a consistent error body (400 validation, 404 missing resource, 409 duplicate).
- **No existing systems affected** — empty repository baseline.
