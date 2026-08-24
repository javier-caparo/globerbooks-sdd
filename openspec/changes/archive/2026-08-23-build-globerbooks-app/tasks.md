# Tasks: build-globerbooks-app

## 1. Server scaffold

- [x] 1.1 Create `server/` npm package with Express, better-sqlite3, drizzle-orm (dev: vitest, supertest) and verify `npm install` succeeds and `node -e "require('express')"` loads in `server/`
- [x] 1.2 Verify better-sqlite3 loads on this Node/Windows setup (`node -e "require('better-sqlite3')"`) ; if it fails, switch to `node:sqlite` fallback per design D2 keeping the repository interface unchanged
- [x] 1.3 Set up Vitest config and a placeholder test, verify `npm test` runs green

## 2. Persistence layer

- [x] 2.1 Implement `server/src/db/init.ts` (CREATE TABLE `books` per design D4) and `server/src/db/client.ts`, verify a temp DB file is created with the expected columns via a unit test
- [x] 2.2 Implement `BookRepository` (insert, listAll newest-first, findById, findByTitleAuthorKey, updateStatus, updateRating, delete) with Drizzle, verify each method against a temp DB in unit tests

## 3. Business services (all rules live here)

- [x] 3.1 Implement `bookService.add` with validation (title 1–500, author 1–200, status whitelist/default) and duplicate flag via title_key/author_key lookup, verify unit tests with mocked repository cover: defaults, invalid status, missing fields, duplicate detected, `force:true` override
- [x] 3.2 Implement `bookService.updateStatus` (valid statuses only, set/clear `date_completed`, clear rating when leaving `completed` per D6), verify unit tests cover: valid transition, invalid status 400, missing book 404, rating cleared on un-complete
- [x] 3.3 Implement `ratingService.setRating` (completed-only guard, integer 1–5, overwrite allowed), verify unit tests cover: rate completed, rate unread/reading rejected `RATING_NOT_ALLOWED`, out-of-range/non-integer rejected `INVALID_RATING`, missing book 404
- [x] 3.4 Implement `bookService.remove` and `bookService.list`, verify unit tests cover: remove existing, remove missing 404, list ordering newest-first

## 4. HTTP API

- [x] 4.1 Implement `AppError` class and Express error middleware returning `{error, code, timestamp}` per design D7, verify unit test asserts body shape and codes for 400/404/409/500
- [x] 4.2 Implement controllers + routes for the D8 surface (GET/POST `/api/v1/books`, PATCH `/books/:id/status`, PUT `/books/:id/rating`, DELETE `/books/:id`), verify supertest integration tests cover every spec scenario in `specs/books/spec.md` (201 add, 400 validation, 409 duplicate + force override, 200 list newest-first, status update + 400/404, rating 200/400 both kinds/404, delete 200/404, empty-list 200)
- [x] 4.3 Add coverage config and verify `services/` coverage ≥80% (`vitest --coverage`)

## 5. Frontend scaffold

- [x] 5.1 Scaffold `client/` with Vite + React + Tailwind, configure dev proxy `/api` → `localhost:3000`, verify `npm run dev` renders the app shell
- [x] 5.2 Implement `client/src/api.js` fetch wrapper for all five endpoints (incl. surfacing 409 duplicate payload), verify unit tests with mocked fetch resolve/throw correctly

## 6. UI features

- [x] 6.1 Implement `BookForm` (title, author, optional status), verify component test: submit calls add API and success/field-error states render
- [x] 6.2 Implement `DuplicateDialog` ("This book may already exist. Add anyway?"), verify component test: shows existing book details, Add-anyway sends `force:true`, cancel aborts
- [x] 6.3 Implement `BookList`/`BookRow` (title, author, status select, delete, rating control only when completed, empty state), verify component tests: rating input hidden unless completed, status change calls API, delete removes row
- [x] 6.4 Wire components in `App` with refetch-after-mutation, verify a manual end-to-end pass in the dev servers: add → duplicate warning → override → mark completed → rate → delete

## 7. Integration & documentation

- [x] 7.1 Configure Express to serve `client/dist` statically in production, verify production build (`npm run build` in client + `npm start` in server) serves the UI and API from one origin
- [x] 7.2 Write `README.md` (setup, run dev, run tests, build, local-use-only note), verify instructions execute as written from a clean checkout
- [x] 7.3 Final gate: run full test suite + coverage in `server/` and component tests in `client/`, verify everything green and every scenario in `specs/books/spec.md` maps to at least one passing test
