# Spec Delta: books

## MODIFIED Requirements

### Requirement: Frontend collection management
The frontend SHALL let the user add a book, view the collection, change a book's status, rate a completed book, remove a book, and act on duplicate warnings — without page reloads lost state. When a mutation (status change, rating, or delete) fails, the frontend SHALL surface a user-visible error message describing the failure.

#### Scenario: Add a book from the UI
- **WHEN** the user fills title and author and submits the add form
- **THEN** the book appears in the collection list

#### Scenario: Rate from the UI is guarded
- **WHEN** the user attempts to rate a book whose status is not `completed`
- **THEN** the UI does not offer rating input for that book, and after marking it `completed` a 1–5 rating input becomes available

#### Scenario: Duplicate warning from the UI
- **WHEN** adding a book triggers a duplicate flag
- **THEN** the UI shows the existing book details with "Add anyway" and "Cancel" actions, and the chosen action is applied

#### Scenario: Mutation failure shows error feedback
- **WHEN** a status change, rating, or delete API call fails (network error or 4xx/5xx response)
- **THEN** the frontend displays a user-visible error message describing the failure, and the book list is not silently updated with stale state
