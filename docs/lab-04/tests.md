# Lab 4 — Test Plan & Traceability Matrix

**Project:** TokTickIT — Ticket Detail & Action System  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Peer Reviewer:** Nannaphat Kaenphanao — 67070505219 — GitHub: [@nannaphatkn](https://github.com/nannaphatkn)  
**Course:** CPE 334 — Full-Stack Web Development  
**Sprint:** Lab 4

---

## 1. Acceptance Criteria (AC) Traceability Matrix

This matrix maps every Acceptance Criterion defined in `docs/lab-04/specification.md` to its actual automated test file path, test case identifier, test layer, and final execution status on the `main` branch.

| AC ID | Acceptance Criterion Description | Test Type / Scope | Actual Test File Path | Test Case ID(s) | Status on `main` |
|:---:|---|:---:|---|---|:---:|
| **AC-01** | IT Staff can claim an unassigned ticket; assignee updated in DB and reflected in UI | API + UI | `server/tests/lab-04/claim-reassign.test.ts`<br>`client/tests/lab-04/ItStaffTicketDetail.test.tsx` | CLM-01, CLM-03<br>UI-IT-02 | ✅ PASS |
| **AC-02** | IT Staff can reassign ticket to another IT Staff member; old assignee replaced | API + UI | `server/tests/lab-04/claim-reassign.test.ts`<br>`client/tests/lab-04/ItStaffTicketDetail.test.tsx` | CLM-04, CLM-07, CLM-11<br>UI-IT-03 | ✅ PASS |
| **AC-03** | Claiming sets status to `IN_PROGRESS` if previously `OPEN` | API / Workflow | `server/tests/lab-04/claim-reassign.test.ts` | CLM-02 | ✅ PASS |
| **AC-04** | IT Staff can change IT Priority; new value saved and displayed immediately | API + UI | `server/tests/lab-04/status-transition.test.ts`<br>`client/tests/lab-04/ItStaffTicketDetail.test.tsx` | STS-17, STS-18, STS-23<br>UI-IT-01b, UI-IT-04 | ✅ PASS |
| **AC-05** | Status dropdown shows only permitted next statuses per state machine | UI / State Machine | `client/tests/lab-04/ItStaffTicketDetail.test.tsx` | UI-IT-05 | ✅ PASS |
| **AC-06** | Attempting an invalid status transition returns `400 Bad Request` | API / Workflow | `server/tests/lab-04/status-transition.test.ts` | STS-08, STS-09, STS-10 | ✅ PASS |
| **AC-07** | Public comments are visible to Requester, IT Staff, and Administrator | API + UI | `server/tests/lab-04/comments.test.ts`<br>`client/tests/lab-04/CommentSection.test.tsx` | CMT-01, CMT-03, CMT-05, CMT-06, CMT-07<br>UI-CMT-01, UI-REQ-05 | ✅ PASS |
| **AC-08** | Internal Notes are NOT visible to Requester (API filters them out server-side) | API / Authorization | `server/tests/lab-04/comments.test.ts`<br>`client/tests/lab-04/RequesterTicketDetail.test.tsx` | CMT-06<br>UI-REQ-05 | ✅ PASS |
| **AC-09** | Requester cannot submit an Internal Note (API rejects with `403 Forbidden`) | Authorization / RBAC | `server/tests/lab-04/comments.test.ts`<br>`server/tests/lab-04/rbac-lab4.test.ts`<br>`client/tests/lab-04/RequesterTicketDetail.test.tsx` | CMT-04<br>RBAC-L4-07<br>UI-REQ-04 | ✅ PASS |
| **AC-10** | "Problem Appears Resolved" button appears for owner when active; resolves on confirm | API + UI | `server/tests/lab-04/requester-actions.test.ts`<br>`server/tests/lab-04/comments.test.ts`<br>`client/tests/lab-04/RequesterTicketDetail.test.tsx` | RAC-01, RAC-02, RAC-03, RAC-04<br>RSLV-01..06<br>UI-REQ-02, UI-REQ-03, UI-REQ-06 | ✅ PASS |
| **AC-11** | Attachments downloadable from Ticket Detail for all roles | API / Regression | `server/tests/lab-02/attachments.test.ts` | ATT-01..11 | ✅ PASS |
| **AC-12** | Direct API call with Requester token to IT-Staff-only endpoint returns `403` | Authorization / RBAC | `server/tests/lab-04/rbac-lab4.test.ts`<br>`server/tests/lab-04/claim-reassign.test.ts`<br>`server/tests/lab-04/status-transition.test.ts` | RBAC-L4-01, RBAC-L4-03, RBAC-L4-05, RBAC-L4-08<br>CLM-05, STS-11, STS-19 | ✅ PASS |
| **AC-13** | Direct API call with IT Staff / Admin token to forbidden endpoint returns `403` | Authorization / RBAC | `server/tests/lab-04/rbac-lab4.test.ts`<br>`server/tests/lab-04/requester-actions.test.ts` | RBAC-L4-02, RBAC-L4-04, RBAC-L4-06<br>RAC-05, RAC-06 | ✅ PASS |
| **AC-14** | Missing or invalid required fields return `422 Unprocessable Entity` | Validation | `server/tests/lab-04/claim-reassign.test.ts`<br>`server/tests/lab-04/status-transition.test.ts`<br>`server/tests/lab-04/comments.test.ts` | CLM-08, STS-13, STS-14, STS-20, STS-21, CMT-09 | ✅ PASS |

---

## 2. Test Files Inventory & Coverage Mapping

### Server-Side Integration & RBAC Test Files (`server/tests/`)

| Test File Path | Scope & Purpose | Test IDs | Test Count | Pass Rate |
|---|---|---|:---:|:---:|
| `server/tests/lab-04/claim-reassign.test.ts` | Ticket claim, status auto-update to IN_PROGRESS, reassign validation, IT user list | CLM-01..13 | 13 | 100% (13/13) |
| `server/tests/lab-04/status-transition.test.ts` | State machine enforcement (OPEN→IN_PROGRESS→PENDING/RESOLVED/CLOSED), IT priority | STS-01..23 | 23 | 100% (23/23) |
| `server/tests/lab-04/comments.test.ts` | Unified comments endpoint (PUBLIC/INTERNAL), role filtering, Requester resolve | CMT-01..10, RSLV-01..06 | 23 | 100% (23/23) |
| `server/tests/lab-04/requester-actions.test.ts` | Requester resolve workflow, status guards (IN_PROGRESS/PENDING vs CLOSED), IDOR protection | RAC-01..07 | 7 | 100% (7/7) |
| `server/tests/lab-04/rbac-lab4.test.ts` | Direct API authorization evidence suite (403 on invalid role across all endpoints) | RBAC-L4-01..09 | 9 | 100% (9/9) |
| `server/tests/lab-03/admin.test.ts` | Regression: Admin user management CRUD, activation toggle, password reset | ADM-01..10 | 10 | 100% (10/10) |
| `server/tests/lab-03/itstaff.test.ts` | Regression: IT Staff queue, filtering, search, claim, internal notes | IT-01..14 | 9 | 100% (9/9) |
| `server/tests/lab-03/auth.test.ts` | Regression: Login, logout, session persistence, mandatory password change | AUTH-01..14 | 9 | 100% (9/9) |
| `server/tests/lab-03/requester.test.ts` | Regression: Requester authenticated actions & isolation | REQA-01..04 | 4 | 100% (4/4) |
| `server/tests/lab-02/tickets-list.test.ts` | Regression: Requester personal ticket list, data isolation, search, pagination | T-13..22 | 10 | 100% (10/10) |
| `server/tests/lab-02/attachments.test.ts` | Regression: Attachment uploads, limits, soft-delete with audit reason, downloads | ATT-01..11 | 11 | 100% (11/11) |
| `server/tests/lab-02/tickets-create.test.ts` | Regression: Ticket creation, validation, multipart form data | TC-01..08 | 8 | 100% (8/8) |
| `server/tests/lab-02/requesters.test.ts` | Regression: Requester profile lookup and isolation | REQ-01..05 | 5 | 100% (5/5) |
| `server/tests/lab-01/categories.test.ts` | Regression: Category listing endpoint | CAT-01 | 1 | 100% (1/1) |
| `server/tests/lab-01/health.test.ts` | Regression: System health check endpoint | HLT-01 | 1 | 100% (1/1) |
| **Server Subtotal** | **All 15 server test suites** | — | **143** | **100% (143/143)** |

### Client-Side UI & Component Test Files (`client/tests/`)

| Test File Path | Scope & Purpose | Test IDs | Test Count | Pass Rate |
|---|---|---|:---:|:---:|
| `client/tests/lab-04/ItStaffTicketDetail.test.tsx` | Ticket title, status badge, priority badge, Claim button, Reassign dropdown, status dropdown restrictions, internal notes lock | UI-IT-01..06 | 7 | 100% (7/7) |
| `client/tests/lab-04/RequesterTicketDetail.test.tsx` | Requester ticket info, "Problem Appears Resolved" button visibility (shown in progress, hidden in closed), confirm modal, no internal toggle | UI-REQ-01..06 | 6 | 100% (6/6) |
| `client/tests/lab-04/CommentSection.test.tsx` | Public comments render, IT Staff toggle visibility, Requester toggle absence, empty submit disabled, form reset | UI-CMT-01..05 | 5 | 100% (5/5) |
| `client/tests/lab-03/LoginPage.test.tsx` | Regression: Login form inputs, validation, credential submission | UI-01..04 | 4 | 100% (4/4) |
| `client/tests/lab-03/ChangePasswordPage.test.tsx` | Regression: Mandatory password change form, validation | UI-05..07 | 3 | 100% (3/3) |
| `client/tests/lab-03/ItQueuePage.test.tsx` | Regression: IT queue table render, search input debounced filtering | UI-08..09 | 2 | 100% (2/2) |
| `client/tests/lab-03/AdminUsersPage.test.tsx` | Regression: User table render, create modal, deactivate confirmation | UI-10..12 | 3 | 100% (3/3) |
| `client/tests/lab-02/SelectRequesterPage.test.tsx` | Regression: Select requester page & navigation | UI-L2-01..07 | 7 | 100% (7/7) |
| `client/tests/lab-01/App.test.tsx` | Regression: App brand navbar, role badge, navigation links | UI-L1-01..04 | 4 | 100% (4/4) |
| **Client Subtotal** | **All 9 client test suites** | — | **41** | **100% (41/41)** |

---

## 3. Server Test Cases Detail

### A. Claim & Reassign (`server/tests/lab-04/claim-reassign.test.ts`)

| ID | Description | Request / Input | Expected Result | Pass |
|----|-------------|-----------------|-----------------|:---:|
| CLM-01 | IT Staff claims unassigned ticket | `POST /api/it-staff/tickets/:id/claim` | 200, assignedStaffId updated to caller | ✅ |
| CLM-02 | Claiming OPEN ticket auto-sets IN_PROGRESS | Ticket in OPEN status | 200, status auto-transitions to `IN_PROGRESS` | ✅ |
| CLM-03 | Claiming IN_PROGRESS ticket keeps status | Ticket already IN_PROGRESS | 200, status remains `IN_PROGRESS` | ✅ |
| CLM-04 | Reassign to another IT Staff member | `PATCH /api/it-staff/tickets/:id/reassign` `{ assigneeId }` | 200, assignedStaffId updated | ✅ |
| CLM-05 | Requester cannot claim | Requester session on `/claim` | 403 Forbidden | ✅ |
| CLM-06 | Admin cannot claim (exclusive to IT Staff) | Administrator session on `/claim` | 403 Forbidden | ✅ |
| CLM-07 | Reassign to non-IT user rejected | Target assigneeId belongs to Requester | 400 Bad Request (`INVALID_ASSIGNEE`) | ✅ |
| CLM-08 | Missing assigneeId on reassign | Body `{}` | 422 Unprocessable Entity (`VALIDATION_ERROR`) | ✅ |
| CLM-09 | Nonexistent ticket on claim | ID `999999` | 404 Not Found (`NOT_FOUND`) | ✅ |
| CLM-10 | Unauthenticated request to claim | No session cookie | 401 Unauthenticated | ✅ |
| CLM-11 | Admin can reassign ticket | Administrator session on `/reassign` | 200, assignee updated | ✅ |
| CLM-12 | GET /api/it-staff/users returns staff list | Authenticated IT Staff session | 200, list containing IT Staff members | ✅ |
| CLM-13 | Nonexistent ticket on reassign | ID `999999` | 404 Not Found | ✅ |

### B. Status Transition State Machine (`server/tests/lab-04/status-transition.test.ts`)

| ID | Transition Under Test | Initial Status → Target | Expected Result | Pass |
|----|-----------------------|-------------------------|-----------------|:---:|
| STS-01 | Valid forward transition | OPEN → IN_PROGRESS | 200 OK, status updated | ✅ |
| STS-02 | Valid transition to pending | IN_PROGRESS → PENDING | 200 OK, status updated | ✅ |
| STS-03 | Valid resolve transition | IN_PROGRESS → RESOLVED | 200 OK, status updated | ✅ |
| STS-04 | Valid close transition | IN_PROGRESS → CLOSED | 200 OK, status updated | ✅ |
| STS-05 | Valid resume from pending | PENDING → IN_PROGRESS | 200 OK, status updated | ✅ |
| STS-06 | Valid resolve from pending | PENDING → RESOLVED | 200 OK, status updated | ✅ |
| STS-07 | Valid close from resolved | RESOLVED → CLOSED | 200 OK, status updated | ✅ |
| STS-08 | Invalid transition: skip in-progress | OPEN → RESOLVED | 400 Bad Request (`INVALID_TRANSITION`) | ✅ |
| STS-09 | Invalid transition: direct close | OPEN → CLOSED | 400 Bad Request (`INVALID_TRANSITION`) | ✅ |
| STS-10 | Invalid transition: modify terminal | CLOSED → IN_PROGRESS | 400 Bad Request (`INVALID_TRANSITION`) | ✅ |
| STS-11 | Requester cannot change status | Requester session | 403 Forbidden | ✅ |
| STS-12 | Admin cannot change status directly | Admin session | 403 Forbidden | ✅ |
| STS-13 | Unknown status value | `status: "FLYING"` | 422 Unprocessable Entity (`VALIDATION_ERROR`) | ✅ |
| STS-14 | Missing status field | Body `{}` | 422 Unprocessable Entity (`VALIDATION_ERROR`) | ✅ |
| STS-15 | Status update on nonexistent ticket | ID `999999` | 404 Not Found | ✅ |
| STS-16 | Unauthenticated status update | No session | 401 Unauthenticated | ✅ |
| STS-17 | IT Staff changes priority to HIGH | `PATCH .../priority` `{ itPriority: "HIGH" }` | 200 OK, itPriority updated | ✅ |
| STS-18 | Administrator changes priority | Admin session on `/priority` | 200 OK, itPriority updated | ✅ |
| STS-19 | Requester cannot change priority | Requester session on `/priority` | 403 Forbidden | ✅ |
| STS-20 | Invalid priority value rejected | `itPriority: "EXTREME"` | 422 Unprocessable Entity (`VALIDATION_ERROR`) | ✅ |
| STS-21 | Missing itPriority field | Body `{}` | 422 Unprocessable Entity (`VALIDATION_ERROR`) | ✅ |
| STS-22 | Priority update on nonexistent ticket | ID `999999` | 404 Not Found | ✅ |
| STS-23 | All 4 priority levels accepted | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | 200 OK for each valid level | ✅ |

### C. Unified Comments & Internal Notes (`server/tests/lab-04/comments.test.ts`)

| ID | Description | Actor / Condition | Expected Result | Pass |
|----|-------------|-------------------|-----------------|:---:|
| CMT-01 | IT Staff posts Public Comment | `POST .../comments` `{ type: "PUBLIC" }` | 201 Created, saved in PublicComment | ✅ |
| CMT-02 | IT Staff posts Internal Note | `POST .../comments` `{ type: "INTERNAL" }` | 201 Created, saved in InternalNote | ✅ |
| CMT-03 | Requester posts Public Comment on own ticket | Requester session, own ticket | 201 Created, saved in PublicComment | ✅ |
| CMT-04 | Requester attempts Internal Note | Requester with `type: "INTERNAL"` | 403 Forbidden | ✅ |
| CMT-05 | IT Staff reads comments list | IT Staff session | 200 OK, sees both PUBLIC and INTERNAL | ✅ |
| CMT-06 | Requester reads comments list | Requester session | 200 OK, sees PUBLIC ONLY (no INTERNAL) | ✅ |
| CMT-07 | Admin reads comments list | Admin session | 200 OK, sees both PUBLIC and INTERNAL | ✅ |
| CMT-08 | Requester reads other user's ticket | Requester on other ticket ID | 403 Forbidden (IDOR protection) | ✅ |
| CMT-09 | Empty comment content rejected | Content `""` or `" "` | 422 Unprocessable Entity | ✅ |
| CMT-10 | Comment on nonexistent ticket | ID `999999` | 404 Not Found | ✅ |
| RSLV-01 | Requester resolves own IN_PROGRESS ticket | `POST .../resolve` on IN_PROGRESS | 200 OK, status transitions to `RESOLVED` | ✅ |
| RSLV-01b| Requester resolves own PENDING ticket | `POST .../resolve` on PENDING | 200 OK, status transitions to `RESOLVED` | ✅ |
| RSLV-01c| Requester resolves already RESOLVED ticket | Idempotent resolve call | 200 OK, status remains `RESOLVED` | ✅ |
| RSLV-02 | IT Staff attempts to call /resolve | IT Staff session | 403 Forbidden (exclusive to Requester) | ✅ |
| RSLV-03 | Admin attempts to call /resolve | Admin session | 403 Forbidden (exclusive to Requester) | ✅ |
| RSLV-04 | Resolve called on CLOSED ticket | Terminal status | 400 Bad Request (`NOT_RESOLVABLE`) | ✅ |
| RSLV-04b| Resolve called on OPEN ticket | Valid initial status | 200 OK, status transitions to `RESOLVED` | ✅ |
| RSLV-05 | Requester resolves another's ticket | IDOR attempt | 403 Forbidden | ✅ |
| RSLV-06 | Unauthenticated resolve call | No session | 401 Unauthenticated | ✅ |

### D. Requester Actions Suite (`server/tests/lab-04/requester-actions.test.ts`)

| ID | Description | Condition | Expected Result | Pass |
|----|-------------|-----------|-----------------|:---:|
| RAC-01 | Requester resolves own IN_PROGRESS ticket | Own ticket, IN_PROGRESS | 200, status = RESOLVED | ✅ |
| RAC-02 | Requester resolves own PENDING ticket | Own ticket, PENDING | 200, status = RESOLVED | ✅ |
| RAC-03 | Requester attempts resolve on CLOSED ticket | Terminal state CLOSED | 400 Bad Request (`NOT_RESOLVABLE`) | ✅ |
| RAC-04 | IDOR attack: Requester resolves another's ticket | Non-owner requester | 403 Forbidden | ✅ |
| RAC-05 | IT Staff attempts resolve endpoint | Role = IT_Staff | 403 Forbidden | ✅ |
| RAC-06 | Admin attempts resolve endpoint | Role = Administrator | 403 Forbidden | ✅ |
| RAC-07 | Unauthenticated resolve call | No session | 401 Unauthenticated | ✅ |

### E. Direct API Authorization Evidence Suite (`server/tests/lab-04/rbac-lab4.test.ts`)

| ID | Tested Endpoint & Method | Actor Token / Role | Expected | Evidence Detail | Pass |
|:---:|---|:---:|:---:|---|:---:|
| **RBAC-L4-01** | `POST /api/it-staff/tickets/:id/claim` | Requester | **403** | Route blocked by `requireRole("IT_Staff")` | ✅ |
| **RBAC-L4-02** | `POST /api/it-staff/tickets/:id/claim` | Administrator | **403** | Route blocked: claim exclusive to IT Staff | ✅ |
| **RBAC-L4-03** | `PATCH /api/it-staff/tickets/:id/status` | Requester | **403** | Route blocked: status change restricted to IT Staff | ✅ |
| **RBAC-L4-04** | `PATCH /api/it-staff/tickets/:id/status` | Administrator | **403** | Inline guard blocked: admin cannot change status | ✅ |
| **RBAC-L4-05** | `PATCH /api/it-staff/tickets/:id/priority` | Requester | **403** | Route blocked: priority change restricted to Staff/Admin | ✅ |
| **RBAC-L4-06** | `POST /api/tickets/:id/resolve` | IT Staff | **403** | Route blocked: resolve exclusive to Requester | ✅ |
| **RBAC-L4-07** | `POST /api/tickets/:id/comments` (`INTERNAL`) | Requester | **403** | Route blocked: Internal Notes restricted to Staff/Admin | ✅ |
| **RBAC-L4-08** | `GET /api/it-staff/users` | Requester | **403** | Route blocked: staff directory restricted to Staff/Admin | ✅ |
| **RBAC-L4-09** | `POST /api/it-staff/tickets/:id/claim` | Unauthenticated | **401** | Middleware blocked: missing session | ✅ |

---

## 4. Client Component Test Cases Detail

### A. IT Staff Ticket Detail (`client/tests/lab-04/ItStaffTicketDetail.test.tsx`)

| ID | Description | UI Interaction / Component State | Expected DOM State | Pass |
|----|-------------|----------------------------------|--------------------|:---:|
| UI-IT-01 | Renders ticket title and status badge when unassigned | Mount with unassigned ticket | Title text, `#TK-...` number, and `Open` badge visible | ✅ |
| UI-IT-01b| Renders IT Priority badge | Mount with ticket having `itPriority: "HIGH"` | `HIGH` priority badge rendered with error-red styling | ✅ |
| UI-IT-02 | Shows Claim button when ticket is unassigned | Unassigned ticket state | Button `#claim-ticket-btn` is rendered and enabled | ✅ |
| UI-IT-03 | Shows assigned badge and Reassign dropdown when assigned | Ticket assigned to current user | Shows `Assigned to you`, `#assignee-select` present | ✅ |
| UI-IT-04 | Priority dropdown shows LOW/MEDIUM/HIGH/CRITICAL | Inspect `#priority-select` options | All 4 valid priority options present in select | ✅ |
| UI-IT-05 | Status dropdown restricts next options by State Machine | Ticket in `OPEN` status | Shows `OPEN` (current) and `IN_PROGRESS` only | ✅ |
| UI-IT-06 | Unified comment thread renders INTERNAL notes with toggle | Ticket with public and internal note | Internal note text rendered, `#toggle-comment-internal` present | ✅ |

### B. Requester Ticket Detail (`client/tests/lab-04/RequesterTicketDetail.test.tsx`)

| ID | Description | Condition / State | Expected DOM State | Pass |
|----|-------------|-------------------|--------------------|:---:|
| UI-REQ-01 | Renders ticket title, category, and status | Mount with requester's own ticket | Title, Category name, and status badge visible | ✅ |
| UI-REQ-02 | "Problem Appears Resolved" button shown when active | Ticket status = `IN_PROGRESS` | Button `#btn-problem-resolved` is visible in DOM | ✅ |
| UI-REQ-03 | "Problem Appears Resolved" button hidden when closed | Ticket status = `CLOSED` | Button `#btn-problem-resolved` is NOT rendered | ✅ |
| UI-REQ-04 | Comment toggle (Public/Internal) is absent for Requester | Requester view inspection | Toggle buttons absent; no internal note controls | ✅ |
| UI-REQ-05 | Internal notes NOT visible in comment list | Feed inspection | Only public comments rendered; no internal note content | ✅ |
| UI-REQ-06 | Confirmation dialog appears on resolve click | Click `#btn-problem-resolved` | Modal `#resolve-modal-title` appears, confirm calls API | ✅ |

### C. Comment Section Component (`client/tests/lab-04/CommentSection.test.tsx`)

| ID | Description | Interaction | Expected DOM State | Pass |
|----|-------------|-------------|--------------------|:---:|
| UI-CMT-01 | Renders public comments in comment thread | Mount comment feed | Comment text and author name rendered | ✅ |
| UI-CMT-02 | IT Staff sees PUBLIC and INTERNAL toggle buttons | IT Staff view | Both `#toggle-comment-public` and `#toggle-comment-internal` present | ✅ |
| UI-CMT-03 | Requester has no comment type toggle buttons | Requester view | Toggle buttons not rendered | ✅ |
| UI-CMT-04 | Comment submit button is disabled when input is empty | Empty textarea or whitespace | Button `#btn-send-comment` has `disabled` attribute | ✅ |
| UI-CMT-05 | Typing valid text enables submit, sends comment, resets | Type text & click Send | Calls `addComment(..., "PUBLIC")` and clears textarea | ✅ |

---

## 5. Final Automated Test Execution Results on `main`

The following test execution output demonstrates that **100% of all automated test suites pass** on the consolidated `main` branch.

### Complete Server Test Suite (`cd server && npx vitest run`)

```text
 RUN  v2.1.9 /Users/patittadaensikaew/Documents/working/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)
 ✓ tests/lab-02/attachments.test.ts (11)
 ✓ tests/lab-02/requesters.test.ts (5)
 ✓ tests/lab-02/tickets-create.test.ts (8)
 ✓ tests/lab-02/tickets-list.test.ts (10)
 ✓ tests/lab-03/admin.test.ts (10)
 ✓ tests/lab-03/auth.test.ts (9)
 ✓ tests/lab-03/itstaff.test.ts (9)
 ✓ tests/lab-03/requester.test.ts (4)
 ✓ tests/lab-04/claim-reassign.test.ts (13)
 ✓ tests/lab-04/comments.test.ts (23)
 ✓ tests/lab-04/rbac-lab4.test.ts (9)
 ✓ tests/lab-04/requester-actions.test.ts (7)
 ✓ tests/lab-04/status-transition.test.ts (23)

 Test Files  15 passed (15)
      Tests  143 passed (143)
   Start at  20:15:20
   Duration  6.81s (tests 26.14s)
```

### Complete Client Test Suite (`cd client && npx vitest run`)

```text
 RUN  v2.1.9 /Users/patittadaensikaew/Documents/working/toktickit/client

 ✓ tests/lab-01/App.test.tsx (4)
 ✓ tests/lab-02/SelectRequesterPage.test.tsx (7)
 ✓ tests/lab-03/AdminUsersPage.test.tsx (3)
 ✓ tests/lab-03/ChangePasswordPage.test.tsx (3)
 ✓ tests/lab-03/ItQueuePage.test.tsx (2)
 ✓ tests/lab-03/LoginPage.test.tsx (4)
 ✓ tests/lab-04/CommentSection.test.tsx (5)
 ✓ tests/lab-04/ItStaffTicketDetail.test.tsx (7)
 ✓ tests/lab-04/RequesterTicketDetail.test.tsx (6)

 Test Files  9 passed (9)
      Tests  41 passed (41)
   Start at  20:15:13
   Duration  1.28s (tests 1.98s)
```

### Overall Project Verification Summary

| Test Layer | Test Files | Tests Passed | Tests Failed | Pass Rate |
|---|:---:|:---:|:---:|:---:|
| **Server Integration & RBAC Tests** | 15 | 143 | 0 | **100%** |
| **Client UI Component Tests** | 9 | 41 | 0 | **100%** |
| **Total Test Suite** | **24** | **184** | **0** | **100% PASS** |
| **TypeScript Static Analysis (`tsc --noEmit`)** | — | — | — | **0 errors** |
