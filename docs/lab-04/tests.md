# Lab 4 — Test Plan & Cases

**Project:** TokTickIT — Ticket Detail & Action System  
**Author:** Patitta Daensikaew — 67070505221  
**Sprint:** Lab 4

---

## Test Files

| File | Scope |
|------|-------|
| `server/src/__tests__/claim-reassign.test.ts` | Claim & Reassign API |
| `server/src/__tests__/status-transition.test.ts` | Status change + state machine |
| `server/src/__tests__/comments.test.ts` | Comments & Internal Notes |
| `server/src/__tests__/requester-actions.test.ts` | Resolve endpoint + IDOR |
| `server/src/__tests__/rbac-lab4.test.ts` | RBAC / 403 evidence |
| `client/src/__tests__/ItStaffTicketDetail.test.tsx` | IT Staff Detail UI |
| `client/src/__tests__/RequesterTicketDetail.test.tsx` | Requester Detail UI |
| `client/src/__tests__/CommentSection.test.tsx` | Comment component |

---

## Server Test Cases

### Claim & Reassign (`claim-reassign.test.ts`)

| ID | Description | Input | Expected |
|----|-------------|-------|----------|
| CLM-01 | IT Staff claims unassigned ticket | `PATCH /api/tickets/:id/claim` { assigneeId: itStaff.id } | 200, assigneeId updated |
| CLM-02 | Claiming OPEN ticket auto-sets IN_PROGRESS | Ticket status = OPEN, claim | 200, status = IN_PROGRESS |
| CLM-03 | Claiming IN_PROGRESS ticket keeps status | Ticket status = IN_PROGRESS, claim | 200, status unchanged |
| CLM-04 | Reassign to another IT Staff | `PATCH .../claim` { assigneeId: otherItStaff.id } | 200, assigneeId = otherItStaff.id |
| CLM-05 | Requester cannot claim | Requester session | 403 |
| CLM-06 | Admin cannot claim | Admin session | 403 |
| CLM-07 | assigneeId not IT Staff → reject | assigneeId = requester.id | 400 |
| CLM-08 | Missing assigneeId → validation error | body = {} | 422 |
| CLM-09 | Ticket not found | id = "nonexistent" | 404 |

---

### Status Transition (`status-transition.test.ts`)

| ID | Description | Current → Target | Expected |
|----|-------------|-----------------|----------|
| STS-01 | OPEN → IN_PROGRESS (valid) | OPEN → IN_PROGRESS | 200 |
| STS-02 | IN_PROGRESS → PENDING (valid) | IN_PROGRESS → PENDING | 200 |
| STS-03 | IN_PROGRESS → RESOLVED (valid) | IN_PROGRESS → RESOLVED | 200 |
| STS-04 | IN_PROGRESS → CLOSED (valid) | IN_PROGRESS → CLOSED | 200 |
| STS-05 | PENDING → IN_PROGRESS (valid) | PENDING → IN_PROGRESS | 200 |
| STS-06 | RESOLVED → CLOSED (valid) | RESOLVED → CLOSED | 200 |
| STS-07 | OPEN → RESOLVED (invalid) | OPEN → RESOLVED | 400 INVALID_TRANSITION |
| STS-08 | CLOSED → anything (invalid) | CLOSED → IN_PROGRESS | 400 INVALID_TRANSITION |
| STS-09 | Requester cannot change status | Requester session | 403 |
| STS-10 | Admin cannot change status | Admin session | 403 |
| STS-11 | Invalid status value | status = "FLYING" | 422 |
| STS-12 | IT Priority change valid | `PATCH .../priority` { itPriority: HIGH } | 200 |
| STS-13 | Requester cannot change priority | Requester session | 403 |
| STS-14 | Invalid priority value | itPriority = "EXTREME" | 422 |

---

### Comments & Internal Notes (`comments.test.ts`)

| ID | Description | Expected |
|----|-------------|----------|
| CMT-01 | IT Staff adds Public Comment | 201, type = PUBLIC |
| CMT-02 | IT Staff adds Internal Note | 201, type = INTERNAL |
| CMT-03 | Requester adds Public Comment on own ticket | 201, type = PUBLIC |
| CMT-04 | Requester attempts Internal Note | 403 |
| CMT-05 | IT Staff GET comments → sees PUBLIC + INTERNAL | 200, both types in response |
| CMT-06 | Requester GET comments → sees PUBLIC only | 200, no INTERNAL in response |
| CMT-07 | Admin GET comments → sees PUBLIC + INTERNAL | 200, both types |
| CMT-08 | Requester GET comments on another's ticket | 403 |
| CMT-09 | Empty content → validation error | 422 |
| CMT-10 | Ticket not found | 404 |

---

### Requester Actions (`requester-actions.test.ts`)

| ID | Description | Expected |
|----|-------------|----------|
| RAC-01 | Requester resolves own IN_PROGRESS ticket | 200, status = RESOLVED |
| RAC-02 | Requester resolves own PENDING ticket | 200, status = RESOLVED |
| RAC-03 | Requester resolves CLOSED ticket → reject | 400 NOT_RESOLVABLE |
| RAC-04 | Requester resolves another user's ticket → IDOR | 403 |
| RAC-05 | IT Staff cannot use resolve endpoint | 403 |
| RAC-06 | Admin cannot use resolve endpoint | 403 |
| RAC-07 | Unauthenticated resolve request | 401 |

---

### RBAC Evidence (`rbac-lab4.test.ts`)

| ID | Endpoint | Actor | Expected | Evidence |
|----|----------|-------|----------|---------|
| RBAC-L4-01 | `PATCH .../claim` | Requester token | **403** | Forbidden |
| RBAC-L4-02 | `PATCH .../claim` | Admin token | **403** | Forbidden |
| RBAC-L4-03 | `PATCH .../status` | Requester token | **403** | Forbidden |
| RBAC-L4-04 | `PATCH .../status` | Admin token | **403** | Forbidden |
| RBAC-L4-05 | `PATCH .../priority` | Requester token | **403** | Forbidden |
| RBAC-L4-06 | `PATCH .../resolve` | IT Staff token | **403** | Forbidden |
| RBAC-L4-07 | `POST .../comments` (INTERNAL) | Requester token | **403** | Forbidden |
| RBAC-L4-08 | `GET /api/users/it-staff` | Requester token | **403** | Forbidden |
| RBAC-L4-09 | All endpoints | No session | **401** | Unauthenticated |

---

## Client Test Cases

### IT Staff Ticket Detail (`ItStaffTicketDetail.test.tsx`)

| ID | Description | Expected |
|----|-------------|----------|
| UI-IT-01 | Renders ticket title, status badge, priority badge | Visible in DOM |
| UI-IT-02 | Shows Claim button when unassigned | `[Claim]` button present |
| UI-IT-03 | Shows Reassign dropdown when assigned | Dropdown with IT Staff list |
| UI-IT-04 | Priority dropdown present and functional | Options: LOW/MEDIUM/HIGH/CRITICAL |
| UI-IT-05 | Status dropdown shows only permitted options | OPEN → only IN_PROGRESS |
| UI-IT-06 | Internal Notes shown with 🔒 badge | Badge rendered |

---

### Requester Ticket Detail (`RequesterTicketDetail.test.tsx`)

| ID | Description | Expected |
|----|-------------|----------|
| UI-REQ-01 | Renders ticket info (own ticket) | Title, category, status visible |
| UI-REQ-02 | "Problem Appears Resolved" shown when status = IN_PROGRESS | Button visible |
| UI-REQ-03 | "Problem Appears Resolved" hidden when status = CLOSED | Button not in DOM |
| UI-REQ-04 | Comment toggle (Public/Internal) NOT shown | Toggle absent |
| UI-REQ-05 | Internal Notes NOT visible in comment list | No internal notes rendered |
| UI-REQ-06 | Confirmation dialog appears on resolve click | Modal shown |

---

### Comment Section (`CommentSection.test.tsx`)

| ID | Description | Expected |
|----|-------------|----------|
| UI-CMT-01 | Renders public comments | Comment content visible |
| UI-CMT-02 | IT Staff sees type toggle | Radio group present |
| UI-CMT-03 | Requester has no type toggle | Radio group absent |
| UI-CMT-04 | Submit disabled on empty content | Button disabled |
| UI-CMT-05 | Submit posts and clears form | Form reset after submit |

---

## Test Results (to be filled after implementation)

```
Server tests:  143 / 143 passing (15 test files)
Client tests:   41 /  41 passing (9 test files)
Total:         184 / 184 passing (24 test files)
```

_(Update after each feature branch is merged)_

---

## Running Tests

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test

# Run specific test file
cd server && npx vitest run src/__tests__/rbac-lab4.test.ts
```
