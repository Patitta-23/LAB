# Lab 4 — Engineering Specification

**Project:** TokTickIT — Ticket Detail & Action System  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334  
**Sprint:** Lab 4  
**Created:** 2026-11-01 (before any implementation code)

---

## 1. Business Context

TokTickIT Lab 4 extends Lab 3 by implementing the full **Ticket Detail & Action System**. All three roles (Requester, IT Staff, Administrator) can now interact with tickets in depth: IT Staff can claim/reassign tickets, change status and priority, and add both public and internal comments. Requesters can reply publicly and close their own tickets via "Problem Appears Resolved." The system enforces role-based access at both the API and UI layers.

---

## 2. Business Rules (BR)

| ID | Rule |
|----|------|
| BR-01 | Every action on a ticket requires an authenticated session (inherited from Lab 3). |
| BR-02 | IT Staff can Claim an unassigned ticket (sets `assigneeId` to themselves). |
| BR-03 | IT Staff can Reassign a claimed ticket to another IT Staff member. |
| BR-04 | Only IT Staff and Administrator can change IT Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). |
| BR-05 | Permitted Ticket Status transitions for IT Staff: `OPEN` → `IN_PROGRESS`, `IN_PROGRESS` → `PENDING` or `RESOLVED` or `CLOSED`, `PENDING` → `IN_PROGRESS` or `RESOLVED`, `RESOLVED` → `CLOSED`. |
| BR-06 | A Requester can only change status of their own ticket: `RESOLVED` → `CLOSED` (via "Problem Appears Resolved" button). |
| BR-07 | Public Comments are visible to all roles (Requester, IT Staff, Administrator). |
| BR-08 | Internal Notes are visible only to IT Staff and Administrator — never to Requesters. |
| BR-09 | A Requester can only add Public Comments (never Internal Notes). |
| BR-10 | Attachments from Lab 2 remain functional — download available on Ticket Detail for all roles. |
| BR-11 | A Requester can only view and act on their own tickets (IDOR protection inherited from Lab 2). |
| BR-12 | Any API endpoint for ticket actions must return `403 Forbidden` when accessed by a role without permission. |
| BR-13 | Input validation must reject malformed or missing required fields with `422 Unprocessable Entity`. |
| BR-14 | All failures must return meaningful error messages (Safe Failure — no stack traces exposed). |

---

## 3. Functional Requirements (FR)

### FR-01: Ticket Detail Screen (IT Staff)
- Accessible by IT Staff and Administrator only.
- Displays: Ticket No., Title, Description, Category, Status badge, IT Priority badge, Assignee, Created By, Created At, Updated At.
- Shows active Attachments with download links (read-only for IT Staff).
- Contains: Claim/Reassign control, IT Priority dropdown, Status transition dropdown, Comment section.

### FR-02: Ticket Detail Screen (Requester)
- Accessible by the ticket's owner (Requester) only.
- Displays: Ticket No., Title, Description, Category, Status badge, Created At, Updated At.
- Shows active Attachments with download links.
- Contains: Public comment thread (read/write), "Problem Appears Resolved" button (visible only when status is `IN_PROGRESS`, `PENDING`, or `RESOLVED`).

### FR-03: Claim / Reassign
- **Claim**: If `assigneeId` is null, IT Staff sees "Claim" button. Clicking assigns the ticket to themselves.
- **Reassign**: If already assigned, IT Staff sees "Reassign" dropdown with list of active IT Staff members.
- Claiming automatically sets status to `IN_PROGRESS` if currently `OPEN`.

### FR-04: IT Priority Change
- Dropdown with values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Available to IT Staff and Administrator on Ticket Detail.
- Change saved immediately (or via Save button — TBD in UI spec).

### FR-05: Status Transition
- Dropdown showing only the **permitted next statuses** based on current status (per BR-05).
- Available to IT Staff only (Requester uses dedicated button — FR-07).
- Invalid transitions are rejected at server level (400 Bad Request).

### FR-06: Comments & Internal Notes
- Comment section below ticket details.
- **IT Staff / Administrator**: Toggle between "Public Comment" and "Internal Note" before submitting.
- **Requester**: Text area visible but type is always "Public" (no toggle shown).
- Comment list shows: Author name, role badge, timestamp, content.
- Internal Notes marked with lock icon — filtered out for Requester at API level.

### FR-07: "Problem Appears Resolved" Button
- Shown only to the ticket's owner (Requester) when status ∈ {`IN_PROGRESS`, `PENDING`, `RESOLVED`}.
- Clicking shows a confirmation dialog.
- On confirm: sets status → `RESOLVED` (or `CLOSED` per final spec).
- Button hidden after status becomes `CLOSED`.

### FR-08: Attachment Continuity
- Existing attachments from Lab 2 are displayed on Ticket Detail.
- Download link works for all authenticated roles.
- No new upload/delete functionality added in Lab 4 (Lab 2 upload flow remains unchanged).

### FR-09: Role Restrictions & Safe Failure
- All protected endpoints check role via middleware before processing.
- Errors returned as structured JSON: `{ "error": "<message>", "code": "<code>" }`.
- No unhandled exceptions reach the client.

### FR-10: Direct API Authorization Evidence
- Integration tests demonstrate that calling protected endpoints with wrong-role tokens returns `403`.
- Test file: `server/src/__tests__/rbac-lab4.test.ts`.

---

## 4. Acceptance Criteria (AC)

| ID | Criterion |
|----|-----------|
| AC-01 | IT Staff can claim an unassigned ticket; assignee is updated in DB and reflected in UI. |
| AC-02 | IT Staff can reassign a ticket to another IT Staff member; old assignee is replaced. |
| AC-03 | Claiming sets status to `IN_PROGRESS` if previously `OPEN`. |
| AC-04 | IT Staff can change IT Priority; new value is saved and displayed immediately. |
| AC-05 | Status dropdown shows only permitted next statuses per BR-05. |
| AC-06 | Attempting an invalid status transition returns `400 Bad Request`. |
| AC-07 | Public comments are visible to Requester, IT Staff, and Administrator. |
| AC-08 | Internal Notes are NOT visible to Requester (API filters them out). |
| AC-09 | Requester cannot submit an Internal Note (API rejects with `403`). |
| AC-10 | "Problem Appears Resolved" button appears for ticket owner when status is active; changes status on confirm. |
| AC-11 | Attachments are downloadable from Ticket Detail for all roles. |
| AC-12 | Direct API call with Requester token to IT-Staff-only endpoint returns `403`. |
| AC-13 | Direct API call with IT Staff token to Admin-only endpoint returns `403`. |
| AC-14 | Missing required fields return `422` with descriptive error message. |

---

## 5. Role & Permission Matrix

| Action | Requester | IT Staff | Administrator |
|--------|-----------|----------|---------------|
| View own ticket detail | ✅ (own only) | ✅ (all) | ✅ (all) |
| Claim / Reassign ticket | ❌ | ✅ | ❌ |
| Change IT Priority | ❌ | ✅ | ❌ |
| Change Status | ❌ (only via button) | ✅ | ❌ |
| "Problem Appears Resolved" | ✅ (own ticket) | ❌ | ❌ |
| Add Public Comment | ✅ (own ticket) | ✅ | ✅ |
| Add Internal Note | ❌ | ✅ | ✅ |
| View Public Comments | ✅ | ✅ | ✅ |
| View Internal Notes | ❌ | ✅ | ✅ |
| Download Attachments | ✅ (own ticket) | ✅ | ✅ |

---

## 6. Status Transition State Machine

```
OPEN ──────────────────────► IN_PROGRESS
                                   │
                    ┌──────────────┤
                    ▼              ▼
                 PENDING ◄──── (back)
                    │
                    ▼
                RESOLVED ◄────────── Requester "Problem Appears Resolved"
                    │
                    ▼
                 CLOSED
```

**IT Staff Permitted Transitions:**
- `OPEN` → `IN_PROGRESS`
- `IN_PROGRESS` → `PENDING`, `RESOLVED`, `CLOSED`
- `PENDING` → `IN_PROGRESS`, `RESOLVED`
- `RESOLVED` → `CLOSED`

**Requester Permitted:**
- `RESOLVED` ← (set via "Problem Appears Resolved" from `IN_PROGRESS` or `PENDING`)

---

## 7. Definition of Done (DoD)

- [x] All Acceptance Criteria (AC-01 to AC-14) verified and tested.
- [x] All new server tests pass (`npm test` in `/server` — 143/143 passing).
- [x] All client tests pass (`npm test` in `/client` — 41/41 passing).
- [x] No regression in existing Lab 2 / Lab 3 tests.
- [x] Spec documents complete and committed to `docs/lab-04/`.
- [x] `ai-use.md` updated with all AI-assisted sessions.
- [x] Peer review completed by `@nannaphatkn`.
- [x] All feature branches merged to `lab4-staging` via PR.
- [x] `lab4-staging` merged to `main` via final PR.
