# Lab 2 — Engineering Specification

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: @Patitta-23  
**Course:** CPE 334  
**Sprint:** Lab 2  
**Created:** 2026-09-03 (before any implementation code)

---

## 1. Business Context

TokTickIT Lab 2 builds the **Requester-side** of the IT Service Desk Portal. Because real authentication (JWT) is deferred to Lab 3, a **Development Requester Selector** simulates user identity, allowing testers to switch between Requesters and verify data isolation.

---

## 2. Business Rules (BR)

| ID | Rule |
|----|------|
| BR-01 | A Ticket must belong to exactly one Requester (owner). |
| BR-02 | A Requester can only view their own Tickets (data isolation). |
| BR-03 | A Ticket must have a Title, Category, and Description to be submitted. |
| BR-04 | Ticket status defaults to `OPEN` on creation. |
| BR-05 | Attachments are limited to a maximum of **5 files** per Ticket. |
| BR-06 | Each attachment file must not exceed **5 MB**. |
| BR-07 | Accepted attachment MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. |
| BR-08 | Attachments are **soft-deleted** (marked inactive with a reason), never hard-deleted. |
| BR-09 | A deleted attachment is no longer visible to the Requester but its record is retained in the DB. |
| BR-10 | Ticket list supports Search (title/description), Filter (status, category), Sort (createdAt, updatedAt), and Pagination (10 per page default). |
| BR-11 | Only `ACTIVE` Requesters appear in the Dev Requester Selector. |

---

## 3. Functional Requirements (FR)

### FR-01: Development Requester Selector
- The app displays a selector (dropdown/card) listing all ACTIVE Requesters seeded in the DB.
- Selecting a Requester sets a session context (localStorage or React context) used for all subsequent API calls.
- Switching Requesters resets the current view and applies the new context immediately.

### FR-02: Create Ticket Screen
- Form fields: Title (text, required), Category (select from seeded list, required), Description (textarea, required), Attachments (file upload, optional).
- Client-side validation runs before submission: all required fields must be filled, file count <= 5, each file <= 5 MB, file type must be in allowed list.
- On success, the API returns the created Ticket and the UI navigates to the Ticket Detail screen.
- On API error, the UI shows an error message without clearing the form.

### FR-03: My Tickets Screen
- Displays only the Tickets owned by the currently selected Requester.
- Supports:
  - **Search**: full-text filter on Title and Description (client or server-side).
  - **Filter**: by Status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) and by Category.
  - **Sort**: by `createdAt` (newest first by default) or `updatedAt`.
  - **Pagination**: 10 items per page; shows total count and page controls.
- Each list item shows: Title, Category, Status badge, `createdAt` timestamp.

### FR-04: Ticket Detail Screen
- Read-only view of all Ticket fields: Title, Category, Description, Status, Timestamps.
- Shows the list of active (non-deleted) Attachments with filename, size, and a Download link.
- Allows uploading additional Attachments (respects BR-05, BR-06, BR-07).
- Allows soft-deleting an Attachment: UI prompts for a removal reason (required, min 10 chars); API marks the attachment as inactive.

### FR-05: Zen Green UI Design System
- All screens implement the Zen Green color token system (see `ui-spec.md`).
- UI is responsive: Desktop (>=1024px), Tablet (768-1023px), Mobile (<768px).

---

## 4. Acceptance Criteria (AC)

### AC-01: Dev Requester Selector
```
Given the app is open
When the selector loads
Then it displays only ACTIVE Requesters from the database

Given Requester A is selected
When I switch to Requester B
Then all subsequent API calls use Requester B's ID
And the My Tickets screen shows only Requester B's tickets
```

### AC-02: Create Ticket — Happy Path
```
Given a Requester is selected
And all required fields are filled
And attached files pass validation (<= 5 files, <= 5MB each, allowed types)
When I submit the form
Then a Ticket is created in the database with status OPEN
And I am navigated to the Ticket Detail screen for the new Ticket
```

### AC-03: Create Ticket — Validation Errors
```
Given the form is submitted with an empty Title
Then an error message "Title is required" is displayed
And no API call is made

Given a file larger than 5 MB is attached
Then an error "File exceeds 5 MB limit" is shown before submission
And the file is not included in the upload

Given 6 or more files are attached
Then an error "Maximum 5 attachments allowed" is shown
```

### AC-04: My Tickets — Data Isolation
```
Given Requester A has 3 tickets and Requester B has 2 tickets
When Requester A is selected and My Tickets is viewed
Then exactly 3 tickets are shown
When the selector switches to Requester B
Then exactly 2 tickets are shown
```

### AC-05: Ticket Detail — Attachment Soft-Delete
```
Given a Ticket has an active Attachment
When I click Remove and enter a reason >= 10 characters
Then the Attachment is marked inactive in the database (deletedAt is set, deleteReason is stored)
And the Attachment no longer appears in the active list

Given I attempt to remove an Attachment with a reason of 9 characters or fewer
Then the form shows a validation error
And the deletion is not submitted
```

---

## 5. Definition of Done (DoD)

- [ ] Feature branch merged into `lab2-staging` via PR with at least 1 peer review approval.
- [ ] All acceptance criteria have a corresponding automated test (unit or API).
- [ ] All tests pass (`npm test` in server and client).
- [ ] UI is verified responsive on Desktop, Tablet, Mobile.
- [ ] AI use is logged in `ai-use.md` for every AI-assisted session.
- [ ] `reviewer.md` updated with PR number, reviewer, and feedback summary.
- [ ] No hardcoded secrets; `.env.example` updated if new env vars are added.
