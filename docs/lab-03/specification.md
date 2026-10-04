# Lab 3 — Engineering Specification

**Project:** TokTickIT — Authentication, IT Staff Workflow & Admin Management  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334  
**Sprint:** Lab 3  
**Created:** 2026-10-04 (before any implementation code)

---

## 1. Business Context

TokTickIT Lab 3 introduces **real authentication** (replacing the Lab 2 Dev Requester Selector), **IT Staff Ticket Workflow**, and an **Administrator User Management** screen. Three distinct roles are now supported: `Requester`, `IT_Staff`, and `Administrator`. Each role has its own screens, permissions, and data visibility rules.

---

## 2. Business Rules (BR)

| ID | Rule |
|----|------|
| BR-01 | Every user must authenticate with email and password before accessing any screen. |
| BR-02 | Sessions are maintained server-side (express-session + cookie). |
| BR-03 | A user with `mustChangePassword = true` is redirected to the Mandatory Password Change screen immediately after login. |
| BR-04 | Passwords must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one digit. |
| BR-05 | Three roles exist: `Requester`, `IT_Staff`, `Administrator`. Each role can only access screens permitted for that role. |
| BR-06 | A Requester can only view their own Tickets (data isolation — IDOR protection same as Lab 2). |
| BR-07 | An IT Staff member can view all Tickets in the queue; they can claim, reassign, set priority, change status, add Public Comments, and add Internal Notes. |
| BR-08 | An Administrator can create, view, edit, enable/disable, and reset passwords for all Users. |
| BR-09 | IT Priority levels are: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| BR-10 | Permitted Ticket Status transitions for IT Staff: `OPEN` → `IN_PROGRESS`, `IN_PROGRESS` → `RESOLVED` or `CLOSED`, `RESOLVED` → `CLOSED`. |
| BR-11 | A Requester can comment publicly on their own Tickets and click "Problem Appears Resolved" (moves status to `RESOLVED`). |
| BR-12 | Internal Notes are only visible to IT Staff and Administrators (not Requesters). |
| BR-13 | Soft-deleted Users (`isActive = false`) cannot log in. |
| BR-14 | When an Admin resets a password, `mustChangePassword` is set to `true` for that user. |
| BR-15 | The Dev Requester Selector from Lab 2 must be completely removed in Lab 3. |

---

## 3. Functional Requirements (FR)

### FR-01: Login Screen
- A single Login screen is the entry point for all roles.
- Fields: Email address (required), Password (required).
- On success, redirect to role-appropriate home screen.
- On failure, show a clear, non-specific error message ("Invalid email or password.").
- No "Remember Me" or OAuth — simple credential auth only.

### FR-02: Mandatory Password Change Screen
- Triggered automatically if `mustChangePassword = true`.
- Fields: New Password, Confirm New Password.
- Client + server validation: min 8 chars, uppercase, lowercase, digit.
- On success, `mustChangePassword` is cleared and user is redirected to home.

### FR-03: Logout
- A Logout button is available in the navigation bar for all authenticated users.
- Destroys the server-side session and redirects to Login.

### FR-04: Requester Screens (Lab 2 Regression with Real Auth)
- All Lab 2 Requester screens remain intact but now use authenticated user identity.
- Requester can add Public Comments on their own Ticket Detail screen.
- Requester can click "Problem Appears Resolved" button, which moves Ticket status to `RESOLVED`.

### FR-05: IT Staff Ticket Queue Screen
- Displays all Tickets in the system (not filtered by requester).
- Supports: Search (title/description), Filter (status, category, IT priority, assignee), Sort (createdAt, updatedAt, IT priority), Pagination (10 per page).
- Each row shows: Ticket No., Summary, Category, Current Status, IT Priority badge, Assignee, Last Updated.
- Clicking a row navigates to IT Staff Ticket Detail.

### FR-06: IT Staff Ticket Detail Screen
- Read-only view of Ticket fields + active Attachments (download only, no upload/delete for IT Staff).
- **Claim / Reassign**: IT Staff can assign the Ticket to themselves or another IT Staff member.
- **Set IT Priority**: Dropdown to set `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Status Transition**: Dropdown showing only permitted next statuses per BR-10.
- **Public Comments**: Threaded read/write comments visible to Requester and IT Staff.
- **Internal Notes**: Threaded write/read notes visible only to IT Staff and Administrator.

### FR-07: Administrator User Management Screen
- Table of all Users (all roles) with columns: Name, Email, Role, Status (Active/Inactive), Last Login.
- Supports: Search (name/email), Filter (role, status), Pagination (10 per page).
- **Create User**: Modal form — Name, Email, Role, initial password (auto-flag `mustChangePassword = true`).
- **Edit User**: Modal form — Name, Email, Role.
- **Toggle Active/Inactive**: Single-click button per row.
- **Reset Password**: Set a new temporary password + flag `mustChangePassword = true`.

### FR-08: Navigation & Role-Based Routing
- Unauthenticated users are redirected to Login from any protected route.
- Authenticated users are redirected away from Login if already logged in.
- Navigation bar shows only links relevant to the logged-in role.

---

## 4. Acceptance Criteria (AC)

### AC-01: Login — Happy Path
```
Given a user exists with email "alice@example.com" and password "Password1"
When they enter correct credentials and submit
Then they are authenticated and redirected to their role's home screen
And the session cookie is set
```

### AC-02: Login — Failure
```
Given an incorrect email or password is entered
When the form is submitted
Then the message "Invalid email or password." is shown
And no session is created
```

### AC-03: Mandatory Password Change
```
Given a user logs in with mustChangePassword = true
Then they are immediately redirected to the Password Change screen
When they enter a valid new password and confirm it
Then mustChangePassword is cleared and they are redirected to home
```

### AC-04: Role-Based Access Control
```
Given a Requester is authenticated
When they navigate to /it-staff/queue
Then they receive a 403 Forbidden response or are redirected to their own home

Given an IT Staff is authenticated
When they navigate to /admin/users
Then they receive a 403 Forbidden response
```

### AC-05: IT Staff Claim Ticket
```
Given an IT Staff member views Ticket #TK-1001 (currently unassigned)
When they click "Claim Ticket"
Then the Ticket's assignedStaffId is set to their user ID
And the ticket list shows their name as Assignee
```

### AC-06: IT Staff Status Transition
```
Given an IT Staff member views a Ticket with status OPEN
When they select "In Progress" from the status dropdown and save
Then the Ticket status is updated to IN_PROGRESS
And the "RESOLVED" / "CLOSED" option is not available from OPEN (only valid next states shown)
```

### AC-07: Public Comment visible to Requester
```
Given IT Staff adds a Public Comment on Ticket #TK-1001
When the Requester views the Ticket Detail for that ticket
Then the Public Comment is visible to them
```

### AC-08: Internal Note hidden from Requester
```
Given IT Staff adds an Internal Note on Ticket #TK-1001
When the Requester views the Ticket Detail for that ticket
Then the Internal Note is NOT visible to them
```

### AC-09: Admin Create User
```
Given an Administrator navigates to User Management
When they fill in the Create User form with valid data and submit
Then a new User is created with mustChangePassword = true
And the new User appears in the User list
```

### AC-10: Logout
```
Given any authenticated user clicks Logout
Then the session is destroyed
And subsequent requests return 401 Unauthorized
And they are redirected to the Login screen
```

---

## 5. Definition of Done (DoD)

- [x] All Spec DD documents created and committed to Git before any implementation code.
- [x] Feature branch merged into `lab3-staging` via PR with at least 1 peer review approval.
- [x] All acceptance criteria have a corresponding automated test (unit or API).
- [x] All tests pass (`npm test` in server and client — 91/91 tests passing).
- [x] Dev Requester Selector from Lab 2 is completely removed.
- [x] UI is verified responsive on Desktop, Tablet, Mobile.
- [x] AI use is logged in `ai-use.md` for every AI-assisted session.
- [x] `reviewer.md` updated with PR number, reviewer, and feedback summary.
- [x] No hardcoded secrets; `.env.example` updated if new env vars are added (e.g., `SESSION_SECRET`).
- [x] Submission evidence (screenshots Part 1–9) prepared.
