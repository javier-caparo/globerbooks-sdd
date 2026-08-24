# Spec: books

## Purpose

Personal book collection management: add, view, update, and remove books; track reading status (`unread`, `reading`, `completed`); rate completed books 1–5; and flag accidental duplicates — exposed via a REST API and a web frontend.

## Requirements

### Requirement: Add a book
The system SHALL allow adding a book with a title and an author. Status SHALL be optional and default to `unread`. The system SHALL generate a unique identifier and a creation timestamp for every added book.

#### Scenario: Add with only title and author
- **WHEN** a book is submitted with a non-empty title and author and no status
- **THEN** the book is created with status `unread`, a system-generated unique id, and a creation timestamp, and the API responds `201 Created`

#### Scenario: Add with invalid status rejected
- **WHEN** a book is submitted with a status value outside `unread`, `reading`, `completed`
- **THEN** the API rejects the request with `400` and a validation error identifying the `status` field

#### Scenario: Add with missing fields rejected
- **WHEN** a book is submitted with an empty or missing title or author
- **THEN** the API rejects the request with `400` and field-specific validation errors

### Requirement: List books
The system SHALL return the full book collection via the API and display it in the frontend, newest first, showing title, author, status, and rating (when present).

#### Scenario: List an empty collection
- **WHEN** the collection is empty and books are requested
- **THEN** the API responds `200` with an empty list and the frontend shows an empty-state message

#### Scenario: List books newest first
- **WHEN** multiple books exist
- **THEN** the API returns them ordered by creation timestamp, newest first, each including id, title, author, status, rating, and timestamps

### Requirement: Update reading status
The system SHALL allow updating a book's status to `unread`, `reading`, or `completed`. When status becomes `completed`, the system SHALL record a completion timestamp.

#### Scenario: Change status to completed
- **WHEN** a book's status is updated to `completed`
- **THEN** the status is stored and a completion timestamp is recorded

#### Scenario: Invalid status rejected
- **WHEN** a status update carries any value other than `unread`, `reading`, `completed`
- **THEN** the API rejects it with `400` and a validation error

#### Scenario: Update a missing book
- **WHEN** a status update targets a book id that does not exist
- **THEN** the API responds `404` with a not-found error

### Requirement: Remove a book
The system SHALL allow removing a book from the collection.

#### Scenario: Remove an existing book
- **WHEN** a removal targets an existing book id
- **THEN** the book is deleted and subsequent listings no longer include it

#### Scenario: Remove a missing book
- **WHEN** a removal targets a book id that does not exist
- **THEN** the API responds `404` with a not-found error

### Requirement: Rate a completed book
The system SHALL accept a rating only for books whose status is `completed`. Ratings SHALL be integers from 1 to 5 inclusive and SHALL be editable after first assignment. The system SHALL reject ratings for books not marked `completed`.

#### Scenario: Rate a completed book
- **WHEN** a rating of 1–5 is submitted for a book with status `completed`
- **THEN** the rating is stored and can be changed later

#### Scenario: Rating rejected for non-completed book
- **WHEN** a rating is submitted for a book with status `unread` or `reading`
- **THEN** the API rejects it with `400` and an error indicating rating is not allowed

#### Scenario: Out-of-range rating rejected
- **WHEN** a rating of 0, 6, a non-integer, or a non-number is submitted
- **THEN** the API rejects it with `400` and a validation error identifying the `rating` field

### Requirement: Flag duplicate books
The system SHALL detect a potential duplicate when adding a book whose title and author match an existing book (case-insensitive, surrounding whitespace trimmed). The system SHALL flag the duplicate to the user and allow an explicit override to add it anyway.

#### Scenario: Duplicate flagged on add
- **WHEN** a book is added whose title and author match an existing book (ignoring case and surrounding whitespace)
- **THEN** the API responds `409` with the existing book's details, and the frontend shows a confirmation prompt "This book may already exist. Add anyway?"

#### Scenario: Override adds the duplicate
- **WHEN** the user confirms the override after a duplicate flag
- **THEN** the book is added and both copies exist in the collection

### Requirement: Consistent error responses
All API errors SHALL use standard HTTP status codes (`400` validation, `404` not found, `409` duplicate, `500` unexpected) and a consistent error body with a human-readable message, a machine-readable error code, and an ISO-8601 timestamp.

#### Scenario: Validation error body
- **WHEN** any request fails validation
- **THEN** the response status is `400` and the body contains a human-readable `error`, a machine-readable `code`, and an ISO-8601 `timestamp`

### Requirement: Frontend collection management
The frontend SHALL let the user add a book, view the collection, change a book's status, rate a completed book, remove a book, and act on duplicate warnings — without page reloads lost state.

#### Scenario: Add a book from the UI
- **WHEN** the user fills title and author and submits the add form
- **THEN** the book appears in the collection list

#### Scenario: Rate from the UI is guarded
- **WHEN** the user attempts to rate a book whose status is not `completed`
- **THEN** the UI does not offer rating input for that book, and after marking it `completed` a 1–5 rating input becomes available

#### Scenario: Duplicate warning from the UI
- **WHEN** adding a book triggers a duplicate flag
- **THEN** the UI shows the existing book details with "Add anyway" and "Cancel" actions, and the chosen action is applied
