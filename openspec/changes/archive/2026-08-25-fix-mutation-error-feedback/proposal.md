# Proposal: fix-mutation-error-feedback

## Why

Three mutation handlers in `App.jsx` (`handleStatusChange`, `handleRating`, `handleDelete`) call the API without try/catch. When a network error or server 4xx/5xx occurs, the promise rejects unhandled and the user sees no feedback — the action appears to have succeeded silently. `handleAdd` already catches errors and surfaces them; the other three need the same treatment for consistency.

## What Changes

- Add try/catch to `handleStatusChange`, `handleRating`, and `handleDelete` in `client/src/App.jsx`
- On error, surface a user-visible error message (matching the pattern already established by `handleAdd` → `BookForm` error state)
- Preserve the current happy-path behavior: successful mutations still refetch the book list

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `books`: The "Frontend collection management" requirement gains a new scenario — mutation failures (status change, rating, delete) SHALL produce user-visible error feedback instead of being swallowed silently.

## Impact

- **Affected code**: `client/src/App.jsx` (3 handler functions), possibly `client/src/components/BookRow.jsx` or `BookList.jsx` if error display moves to the row level, and corresponding component tests
- **APIs**: no backend changes — the server already returns structured errors (`{error, code, timestamp}`); the fix is purely client-side error handling
- **Dependencies**: none added
- **Tests**: new component/integration test(s) verifying error feedback renders when a mutation API call fails
