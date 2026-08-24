# GloberBooks

Personal reading list tracker — a Spec-Driven Development pilot (see `sdd-workflow_exercise.md`).

Track books you want to read, are reading, and have completed. Rate completed books 1–5. Get warned about accidental duplicates.

## Stack

- **Backend:** Node.js + Express, SQLite via Drizzle ORM + better-sqlite3
- **Frontend:** React + Vite + Tailwind CSS
- **Tests:** Vitest + Supertest (server), Vitest + Testing Library (client)

## Requirements

- Node.js >= 20.19.0

## Setup

```bash
cd server && npm install
cd ../client && npm install
```

## Run (development)

Two terminals:

```bash
# terminal 1 — API on http://localhost:3000
cd server && npm run dev

# terminal 2 — UI on http://localhost:5173 (proxies /api to :3000)
cd client && npm run dev
```

## Run (production)

```bash
cd client && npm run build          # outputs to client/dist/
cd ../server && npm start           # serves UI + API on http://localhost:3000
```

## Tests

```bash
# server — unit + API integration
cd server && npm test

# server — with coverage (services/ >= 80%)
cd server && npm run test:coverage

# client — component + api wrapper tests
cd client && npm test
```

## Notes

- **Local use only** — no authentication; do not expose the API publicly.
- Database file: `server/data/globerbooks.db` (override with `DB_PATH` env var).
- Port: 3000 (override with `PORT` env var).
