# Tasks: fix-mutation-error-feedback

## 1. Add error state and banner to App

- [x] 1.1 Add `mutationError` state to `App.jsx`, render a dismissible error banner (role="alert") above `BookList` when set, and verify the banner is absent on initial render
- [x] 1.2 Wrap `handleStatusChange`, `handleRating`, and `handleDelete` in try/catch: on error set `mutationError` to `error.message` and skip `refresh()`; clear `mutationError` at the start of each handler, verify all three handlers catch a rejected `api.*` call and set the error message

## 2. Tests

- [x] 2.1 Add a component test that mocks `api.updateStatus` to reject, renders `App` with a seeded book, fires a status change, and verifies the error banner appears with the rejected message and the book list is unchanged
- [x] 2.2 Add component tests for `handleRating` rejection and `handleDelete` rejection (same pattern), verify error banner shows and list is stable in both cases
- [x] 2.3 Verify `npm test` in `client/` is green and existing tests still pass
