# Design: fix-mutation-error-feedback

## Context

See proposal.md for motivation. The current `App.jsx` has three unguarded mutation handlers (`handleStatusChange`, `handleRating`, `handleDelete`) that reject silently on API failure. `handleAdd` already catches and routes errors to `BookForm`'s error state. The server returns structured `{error, code, timestamp}` bodies — the client's `api.js` wrapper already parses these into thrown errors with `.message`, `.status`, `.code`.

## Goals / Non-Goals

**Goals:**
- All three mutation handlers catch API errors and surface a user-visible message
- Error display uses the simplest mechanism that's testable and consistent with the existing add-error pattern

**Non-Goals:**
- Per-row error indicators (over-engineered for a personal-use app)
- Toast/notification system or auto-dismiss timers
- Retry logic or optimistic updates with rollback

## Decisions

### D1 — App-level error banner
Add a `mutationError` state to `App`. On any mutation catch, set it to `error.message`. Render a dismissible banner above `BookList` when set. *Alternative:* per-row error in `BookRow` — rejected, requires threading error state + callbacks through `BookList` for marginal benefit. *Alternative:* reuse `BookForm`'s error `<p role="alert">` — rejected, the form error is scoped to add failures, not row-level mutations.

### D2 — Do not refresh on error
On catch, skip the `refresh()` call. The book list keeps its current (correct) state rather than potentially re-rendering with stale data. This matches the spec scenario: "the book list is not silently updated with stale state."

### D3 — Clear error on next successful mutation
Before each mutation attempt, clear `mutationError` to `null`. A new error replaces the old one; a success removes the banner. No manual dismiss button needed, but the banner is dismissible via a close button for UX.

## Risks / Trade-offs

- [App-level banner is less contextual than per-row errors] → Accepted; the error message includes enough context (e.g., "Could not update status: Rating is only allowed for completed books") for a personal-use app
- [Multiple rapid failures overwrite each other's error] → Accepted; only the latest error matters, and clearing-on-next-mutation keeps the UI clean
