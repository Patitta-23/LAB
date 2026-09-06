# Lab 2 — Test Plan

**Project:** TokTickIT — Lab 2  
**Author:** Patitta Daensikaew  

All test files live under:
- `server/tests/lab-02/` — API & unit tests (Vitest + Supertest)
- `client/tests/lab-02/` — UI component tests (Vitest + Testing Library)

---

## 1. Test Matrix (Traceable to AC)

| # | AC | Layer | Tool | Test Description | Status |
|---|----|-------|------|-----------------|--------|
| T-01 | AC-01 | API | Supertest | GET /requesters returns only ACTIVE requesters | [x] |
| T-02 | AC-01 | UI | Testing Library | Selector renders all active requester names | [x] |
| T-03 | AC-01 | UI | Testing Library | Switching requester updates stored context | [x] |
| T-04 | AC-02 | API | Supertest | POST /tickets with valid data returns 201 + ticket object | [x] |
| T-05 | AC-02 | API | Supertest | Created ticket has status OPEN | [x] |
| T-06 | AC-02 | API | Supertest | Created ticket is associated to correct requesterId | [x] |
| T-07 | AC-03 | API | Supertest | POST /tickets without title returns 400 | [x] |
| T-08 | AC-03 | API | Supertest | POST /tickets with invalid categoryId returns 400 | [x] |
| T-09 | AC-03 | API | Supertest | POST /tickets with 6 files returns 422 | [x] |
| T-10 | AC-03 | API | Supertest | POST /tickets with file > 5MB returns 422 | [x] |
| T-11 | AC-03 | UI | Testing Library | Form shows "Title is required" when submitted empty | [x] |
| T-12 | AC-03 | UI | Testing Library | File > 5MB shows error before submission | [x] |
| T-13 | AC-04 | API | Supertest | GET /tickets returns only requester's own tickets | [x] |
| T-14 | AC-04 | API | Supertest | GET /tickets with different X-Requester-Id returns different data | [x] |
| T-15 | AC-04 | API | Supertest | GET /tickets?search= filters by title and description | [x] |
| T-16 | AC-04 | API | Supertest | GET /tickets?status=OPEN filters correctly | [x] |
| T-17 | AC-04 | API | Supertest | GET /tickets pagination: page=1&limit=2 returns 2 items | [x] |
| T-18 | AC-05 | API | Supertest | DELETE /attachments/:id with valid reason returns 200 | [x] |
| T-19 | AC-05 | API | Supertest | Soft-deleted attachment no longer appears in GET /tickets/:id | [x] |
| T-20 | AC-05 | API | Supertest | DELETE /attachments/:id with reason < 10 chars returns 400 | [x] |
| T-21 | AC-05 | API | Supertest | DELETE /attachments/:id belonging to another requester returns 403 | [x] |
| T-22 | AC-05 | UI | Testing Library | Remove button shows reason modal | [x] |
| T-23 | AC-05 | UI | Testing Library | Submitting modal with short reason shows validation error | [x] |

---

## 2. Test File Plan

```
server/tests/lab-02/
  requesters.test.ts      — T-01
  tickets-create.test.ts  — T-04, T-05, T-06, T-07, T-08, T-09, T-10
  tickets-list.test.ts    — T-13, T-14, T-15, T-16, T-17
  attachments.test.ts     — T-18, T-19, T-20, T-21

client/tests/lab-02/
  RequesterSelector.test.tsx  — T-02, T-03
  CreateTicketForm.test.tsx   — T-11, T-12
  AttachmentPanel.test.tsx    — T-22, T-23
```

---

## 3. Terminal Output (fill after running tests)

### Server Tests
```
 RUN  v2.1.9 /Users/patittadaensikaew/Documents/working/toktickit/server

 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/requesters.test.ts (5 tests)
 ✓ tests/lab-02/tickets-list.test.ts (10 tests)
 ✓ tests/lab-02/attachments.test.ts (11 tests)
 ✓ tests/lab-02/tickets-create.test.ts (8 tests)

 Test Files  6 passed (6)
      Tests  36 passed (36)
```

### Client Tests
```
 RUN  v2.1.9 /Users/patittadaensikaew/Documents/working/toktickit/client

 ✓ tests/lab-01/App.test.tsx (4 tests)

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

---

## 4. Notes
- All API tests use `X-Requester-Id` header to simulate the authenticated requester.
- Attachment upload tests use in-memory buffers (no real file I/O needed for unit tests).
- The soft-delete test must verify both the API response AND the database state (attachment.deletedAt is not null).

