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
| T-01 | AC-01 | API | Supertest | GET /requesters returns only ACTIVE requesters | [ ] |
| T-02 | AC-01 | UI | Testing Library | Selector renders all active requester names | [ ] |
| T-03 | AC-01 | UI | Testing Library | Switching requester updates stored context | [ ] |
| T-04 | AC-02 | API | Supertest | POST /tickets with valid data returns 201 + ticket object | [ ] |
| T-05 | AC-02 | API | Supertest | Created ticket has status OPEN | [ ] |
| T-06 | AC-02 | API | Supertest | Created ticket is associated to correct requesterId | [ ] |
| T-07 | AC-03 | API | Supertest | POST /tickets without title returns 400 | [ ] |
| T-08 | AC-03 | API | Supertest | POST /tickets with invalid categoryId returns 400 | [ ] |
| T-09 | AC-03 | API | Supertest | POST /tickets with 6 files returns 422 | [ ] |
| T-10 | AC-03 | API | Supertest | POST /tickets with file > 5MB returns 422 | [ ] |
| T-11 | AC-03 | UI | Testing Library | Form shows "Title is required" when submitted empty | [ ] |
| T-12 | AC-03 | UI | Testing Library | File > 5MB shows error before submission | [ ] |
| T-13 | AC-04 | API | Supertest | GET /tickets returns only requester's own tickets | [ ] |
| T-14 | AC-04 | API | Supertest | GET /tickets with different X-Requester-Id returns different data | [ ] |
| T-15 | AC-04 | API | Supertest | GET /tickets?search= filters by title and description | [ ] |
| T-16 | AC-04 | API | Supertest | GET /tickets?status=OPEN filters correctly | [ ] |
| T-17 | AC-04 | API | Supertest | GET /tickets pagination: page=1&limit=2 returns 2 items | [ ] |
| T-18 | AC-05 | API | Supertest | DELETE /attachments/:id with valid reason returns 200 | [ ] |
| T-19 | AC-05 | API | Supertest | Soft-deleted attachment no longer appears in GET /tickets/:id | [ ] |
| T-20 | AC-05 | API | Supertest | DELETE /attachments/:id with reason < 10 chars returns 400 | [ ] |
| T-21 | AC-05 | API | Supertest | DELETE /attachments/:id belonging to another requester returns 403 | [ ] |
| T-22 | AC-05 | UI | Testing Library | Remove button shows reason modal | [ ] |
| T-23 | AC-05 | UI | Testing Library | Submitting modal with short reason shows validation error | [ ] |

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
(to be filled after implementation)
```

### Client Tests
```
(to be filled after implementation)
```

---

## 4. Notes
- All API tests use `X-Requester-Id` header to simulate the authenticated requester.
- Attachment upload tests use in-memory buffers (no real file I/O needed for unit tests).
- The soft-delete test must verify both the API response AND the database state (attachment.deletedAt is not null).
