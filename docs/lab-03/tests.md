# Lab 3 — Test Plan

**Project:** TokTickIT — Authentication, IT Staff Workflow & Admin Management  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334  
**Sprint:** Lab 3  
**Created:** 2026-10-04 (before any implementation code)

---

## 1. Testing Strategy

Lab 3 introduces authentication, role-based access control, and complex multi-actor workflows. The test plan covers:

1. **Unit Tests** — Individual utility functions (password hashing, session middleware, status transition logic)
2. **API Integration Tests** — All REST endpoints tested with real database calls (Supertest + Vitest)
3. **Authentication & Authorization Tests** — Login, logout, session persistence, role guards
4. **UI Component Tests** — React component rendering and interaction (Vitest + React Testing Library)
5. **Regression Tests** — Lab 2 Requester screens still work with real auth replacing Dev Selector

**Test Frameworks:**
- Server: `vitest` + `supertest` + `@prisma/client` (test DB)
- Client: `vitest` + `@testing-library/react` + `@testing-library/user-event`

---

## 2. Test Matrix

### A. Authentication Tests (`server/tests/lab-03/auth.test.ts`)

| Test ID | Test Case | Input | Expected Result | AC Ref |
|---|---|---|---|---|
| AUTH-01 | Login — valid credentials (Requester) | `email: alice@example.com`, `password: Password1` | 200 OK, session cookie set, role: `Requester` | AC-01 |
| AUTH-02 | Login — valid credentials (IT Staff) | `email: bob@example.com`, `password: Password1` | 200 OK, role: `IT_Staff` | AC-01 |
| AUTH-03 | Login — valid credentials (Admin) | `email: carol@example.com`, `password: Password1` | 200 OK, role: `Administrator` | AC-01 |
| AUTH-04 | Login — wrong password | `password: WrongPass` | 401 Unauthorized, `"Invalid email or password."` | AC-02 |
| AUTH-05 | Login — unknown email | `email: nobody@example.com` | 401 Unauthorized, non-specific message | AC-02 |
| AUTH-06 | Login — inactive account | `email: inactive@example.com` | 403 Forbidden, account deactivated message | BR-13 |
| AUTH-07 | Login — mustChangePassword = true | Valid credentials, `mustChangePassword: true` | 200 OK, response includes `mustChangePassword: true` | AC-03 |
| AUTH-08 | GET `/api/auth/me` — authenticated | Active session | 200 OK, returns user identity | FR-08 |
| AUTH-09 | GET `/api/auth/me` — unauthenticated | No session | 401 Unauthorized | FR-08 |
| AUTH-10 | POST `/api/auth/logout` | Active session | 200 OK, session destroyed | AC-10 |
| AUTH-11 | POST `/api/auth/change-password` — valid | New password meets complexity rules | 200 OK, `mustChangePassword` cleared | AC-03 |
| AUTH-12 | POST `/api/auth/change-password` — too short | `newPassword: "abc"` | 400 Bad Request, validation error | BR-04 |
| AUTH-13 | POST `/api/auth/change-password` — no uppercase | `newPassword: "password1"` | 400 Bad Request | BR-04 |
| AUTH-14 | POST `/api/auth/change-password` — passwords don't match | `confirmPassword != newPassword` | 400 Bad Request | BR-04 |

---

### B. Role-Based Access Control Tests (`server/tests/lab-03/rbac.test.ts`)

| Test ID | Test Case | Authenticated As | Endpoint | Expected Result | AC Ref |
|---|---|---|---|---|---|
| RBAC-01 | Requester cannot access IT Staff queue | `Requester` | `GET /api/it-staff/tickets` | 403 Forbidden | AC-04 |
| RBAC-02 | Requester cannot access Admin users | `Requester` | `GET /api/admin/users` | 403 Forbidden | AC-04 |
| RBAC-03 | IT Staff cannot access Admin users | `IT_Staff` | `GET /api/admin/users` | 403 Forbidden | AC-04 |
| RBAC-04 | IT Staff can access ticket queue | `IT_Staff` | `GET /api/it-staff/tickets` | 200 OK | FR-05 |
| RBAC-05 | Administrator can access user management | `Administrator` | `GET /api/admin/users` | 200 OK | FR-07 |
| RBAC-06 | Unauthenticated access to protected route | No session | `GET /api/tickets` | 401 Unauthorized | FR-08 |
| RBAC-07 | Requester cannot view another requester's tickets | `Requester (Alice)` | `GET /api/tickets/:id (Bob's ticket)` | 403 Forbidden | BR-06 |

---

### C. IT Staff Ticket Management Tests (`server/tests/lab-03/itstaff.test.ts`)

| Test ID | Test Case | Input | Expected Result | AC Ref |
|---|---|---|---|---|
| IT-01 | Get all tickets (IT Staff) | `GET /api/it-staff/tickets` | 200 OK, all tickets returned | FR-05 |
| IT-02 | Search tickets by title | `?search=laptop` | Returns tickets with "laptop" in title | FR-05 |
| IT-03 | Filter tickets by status | `?status=OPEN` | Returns only OPEN tickets | FR-05 |
| IT-04 | Filter tickets by priority | `?priority=HIGH` | Returns only HIGH priority tickets | FR-05 |
| IT-05 | Claim ticket (unassigned) | `POST /api/it-staff/tickets/1/claim` | 200 OK, assignedStaffId = current user | AC-05 |
| IT-06 | Claim ticket (already assigned to self) | Already claimed | 200 OK (idempotent) | AC-05 |
| IT-07 | Status transition — OPEN → IN_PROGRESS | `PATCH status: "IN_PROGRESS"` | 200 OK, status updated | AC-06, BR-10 |
| IT-08 | Status transition — OPEN → RESOLVED (invalid) | `PATCH status: "RESOLVED"` | 400 Bad Request, invalid transition | AC-06, BR-10 |
| IT-09 | Status transition — IN_PROGRESS → RESOLVED | `PATCH status: "RESOLVED"` | 200 OK | BR-10 |
| IT-10 | Status transition — IN_PROGRESS → CLOSED | `PATCH status: "CLOSED"` | 200 OK | BR-10 |
| IT-11 | Set IT Priority | `PATCH itPriority: "CRITICAL"` | 200 OK, priority updated | FR-06 |
| IT-12 | Add public comment (IT Staff) | `POST /api/tickets/1/comments` | 201 Created, comment visible | AC-07 |
| IT-13 | Add internal note (IT Staff) | `POST /api/it-staff/tickets/1/notes` | 201 Created | FR-06 |
| IT-14 | Internal note not in Requester API | Requester session, `GET /api/tickets/1` | Response has no `internalNotes` field | AC-08 |
| IT-15 | Requester public comment visible to IT Staff | IT Staff gets ticket detail | Public comment visible | AC-07 |

---

### D. Admin User Management Tests (`server/tests/lab-03/admin.test.ts`)

| Test ID | Test Case | Input | Expected Result | AC Ref |
|---|---|---|---|---|
| ADMIN-01 | Get all users (Admin) | `GET /api/admin/users` | 200 OK, all users returned | FR-07 |
| ADMIN-02 | Search users by name | `?search=alice` | Returns matching user | FR-07 |
| ADMIN-03 | Filter users by role | `?role=IT_Staff` | Returns IT Staff only | FR-07 |
| ADMIN-04 | Create user — valid | Full valid payload | 201 Created, `mustChangePassword: true` | AC-09 |
| ADMIN-05 | Create user — duplicate email | Same email as existing user | 409 Conflict | FR-07 |
| ADMIN-06 | Create user — missing required field | No email | 400 Bad Request | FR-07 |
| ADMIN-07 | Edit user name | `PATCH name: "New Name"` | 200 OK, name updated | FR-07 |
| ADMIN-08 | Toggle user inactive | `PATCH /api/admin/users/1/toggle-active` | 200 OK, `isActive: false` | BR-13 |
| ADMIN-09 | Inactive user cannot login | Deactivated user's credentials | 403 Forbidden | BR-13 |
| ADMIN-10 | Reset password | `POST /api/admin/users/1/reset-password` | 200 OK, `mustChangePassword: true` | BR-14 |

---

### E. UI Component Tests (`client/tests/lab-03/`)

| Test ID | File | Component | Test Case |
|---|---|---|---|
| UI-01 | `LoginPage.test.tsx` | `LoginPage` | Renders email and password inputs |
| UI-02 | `LoginPage.test.tsx` | `LoginPage` | Submit with empty fields shows validation error |
| UI-03 | `LoginPage.test.tsx` | `LoginPage` | Correct credentials call `/api/auth/login` |
| UI-04 | `LoginPage.test.tsx` | `LoginPage` | Failed login shows "Invalid email or password." |
| UI-05 | `ChangePasswordPage.test.tsx` | `ChangePasswordPage` | Renders new/confirm password fields |
| UI-06 | `ChangePasswordPage.test.tsx` | `ChangePasswordPage` | Mismatch passwords shows validation error |
| UI-07 | `ChangePasswordPage.test.tsx` | `ChangePasswordPage` | Weak password shows complexity error |
| UI-08 | `ITStaffQueuePage.test.tsx` | `ITStaffQueuePage` | Renders ticket queue table |
| UI-09 | `ITStaffQueuePage.test.tsx` | `ITStaffQueuePage` | Search input filters displayed tickets |
| UI-10 | `AdminUsersPage.test.tsx` | `AdminUsersPage` | Renders user management table |
| UI-11 | `AdminUsersPage.test.tsx` | `AdminUsersPage` | Create User modal opens on button click |
| UI-12 | `AdminUsersPage.test.tsx` | `AdminUsersPage` | Deactivate confirmation modal appears |

---

### F. Lab 2 Regression Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| REG-01 | Dev Requester Selector no longer rendered | `/select-requester` route removed; redirects to `/login` |
| REG-02 | Create Ticket uses authenticated user identity | `requesterId` from session, not from localStorage |
| REG-03 | My Tickets shows only authenticated Requester's tickets | Data isolation maintained |
| REG-04 | Ticket Detail public comment visible to Requester | Public comment from IT Staff appears |
| REG-05 | "Problem Appears Resolved" button moves status to RESOLVED | `POST /api/tickets/:id/resolve` returns 200 OK |

---

## 3. Test Results Log

> *(Update after each test run)*

| Date | Test Suite | Passed | Failed | Notes |
|---|---|---|---|---|
| 2026-10-04 | Spec written (pre-implementation) | — | — | Baseline specification committed to `feature/lab3-spec` |
| 2026-10-04 | Server: Auth & RBAC (`server/tests/lab-03/auth.test.ts`) | 9 / 9 | 0 | Login, logout, /me, mustChangePassword, session cookies, bcrypt verification |
| 2026-10-04 | Server: IT Staff Workflow (`server/tests/lab-03/itstaff.test.ts`) | 9 / 9 | 0 | Queue filters, claim/assign, BR-10 status transitions, IT priority, internal notes isolation |
| 2026-10-04 | Server: Admin User Management (`server/tests/lab-03/admin.test.ts`) | 10 / 10 | 0 | User CRUD, toggle active (self & last admin guards), reset password, 409 duplicate email |
| 2026-10-04 | Server: Requester & Regression (`server/tests/lab-03/requester.test.ts` + Lab 1 & 2) | 40 / 40 | 0 | Authenticated requester flow, Problem Appears Resolved, Lab 1 & 2 regression tests |
| 2026-10-04 | Client: Component Tests (`client/tests/lab-03/` + Lab 1 & 2) | 23 / 23 | 0 | LoginPage (UI-01..04), ChangePasswordPage (UI-05..07), ItQueuePage (UI-08..09), AdminUsersPage (UI-10..12), App nav & roles |
| **Total** | **Full System Test Suite (Server + Client)** | **91 / 91** | **0** | **100% Pass Rate across all 16 test files (68 Server + 23 Client)** |
