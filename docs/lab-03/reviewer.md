# Lab 3 — Peer Review Record

**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Peer Reviewer:** Nannaphat Kaenphanao — 67070505219 — GitHub: [@nannaphatkn](https://github.com/nannaphatkn)  
**Repository:** [Patitta-23/LAB](https://github.com/Patitta-23/LAB)  
**Sprint:** Lab 3 — Authentication, IT Staff Workflow & Admin Management

---

## Overview & Review Workflow

In accordance with Lab 3 Specification and Definition of Done (DoD), all feature branches are developed in isolation, peer-reviewed via GitHub Pull Requests, and merged into `lab3-staging` before final consolidation into `main`.

---

## 1. Pull Requests I Authored (Reviewed by Partner `@nannaphatkn`)

| PR Link | Branch | Description & Scope | Reviewer Verdict | Detailed Comments Received | Author Response & Action Taken | Status |
|---|---|---|---|---|---|---|
| [#34](https://github.com/Patitta-23/LAB/pull/34) | `feature/lab3-spec` | **Spec DD Documentation**<br>• specification.md, ui-spec.md, api-spec.md<br>• tests.md, reviewer.md, ai-use.md | ✅ Approved | LGTM — spec covers all BRs and FRs completely | No changes required | Merged |
| [#35](https://github.com/Patitta-23/LAB/pull/35) | `feature/lab3-auth` | **Authentication System**<br>• Login screen<br>• Mandatory Password Change<br>• Session middleware & RBAC | ✅ Approved | LGTM — session httpOnly confirmed, RBAC enforced | No changes required | Merged |
| [#36](https://github.com/Patitta-23/LAB/pull/36) | `feature/lab3-itstaff` | **IT Staff Ticket Queue & Detail**<br>• Ticket queue with filters<br>• Claim, Assign, Priority, Status transitions<br>• Public Comments & Internal Notes | ✅ Approved | LGTM — status transitions validated, internal notes not leaked | No changes required | Merged |
| [#37](https://github.com/Patitta-23/LAB/pull/37) | `feature/lab3-admin` | **Admin User Management**<br>• User table with CRUD<br>• Create/Edit/Toggle/Reset password<br>• Confirmation modals | ✅ Approved | LGTM — duplicate email returns 409, BR-14 enforced | No changes required | Merged |
| [#38](https://github.com/Patitta-23/LAB/pull/38) | `feature/lab3-requester` | **Requester Regression + Public Comments**<br>• Remove Dev Selector<br>• Authenticated identity<br>• "Problem Appears Resolved" button | ✅ Approved | LGTM — Dev Selector fully removed, IDOR protection verified | No changes required | Merged |
| [#39](https://github.com/Patitta-23/LAB/pull/39) | `lab3-staging` | **Lab 3 Staging Release Candidate**<br>• Final consolidation of all Lab 3 features<br>• Full regression test suite<br>• Submission documentation | *(pending approval)* | *(pending review)* | Fixed toggle-active guards (self-deactivation + last admin protection) per reviewer feedback | Open |

---

## 2. Pull Requests I Reviewed for Partner (`@nannaphatkn`)

| PR Link | Partner Branch | Feature Reviewed | My Verdict | Detailed Comments Given | Partner Response & Action Taken | Status |
|---|---|---|---|---|---|---|
| [#28](https://github.com/nannaphatkn/toktickit/pull/28) | `feature/lab3-spec` | Spec DD Documentation | ✅ Approved | LGTM — spec docs complete and well-structured | — | Merged |
| [#29](https://github.com/nannaphatkn/toktickit/pull/29) | `feature/lab3-auth` | Authentication System | ✅ Approved | LGTM — RBAC and session implementation verified | — | Merged |
| [#32](https://github.com/nannaphatkn/toktickit/pull/32) | `feature/lab3-itstaff` | IT Staff Workflow | ✅ Approved | LGTM — status transitions and internal notes verified | — | Merged |
| [#33](https://github.com/nannaphatkn/toktickit/pull/33) | `feature/lab3-admin` | Admin User Management | ✅ Approved | LGTM — CRUD and password reset verified | — | Merged |
| [#36](https://github.com/nannaphatkn/toktickit/pull/36) | `feature/lab3-requester` | Requester Regression | ✅ Approved | LGTM — IDOR protection and Dev Selector removal verified | — | Merged |

---

## 3. Peer Review Checklist & Criteria

During the code review process, both reviewers will verify code against the following checklist:

### A. Security & Authentication
- [x] Login endpoint returns non-specific error messages (no enumeration of users).
- [x] Session cookie is `httpOnly: true` and uses a secure `SESSION_SECRET`.
- [x] Inactive users (`isActive = false`) cannot authenticate.
- [x] `mustChangePassword` flag is enforced client-side routing before any other action.

### B. Role-Based Access Control (RBAC)
- [x] Every protected API route uses `requireAuth` middleware.
- [x] Role-specific routes use `requireRole(...)` middleware.
- [x] Requester cannot access IT Staff or Admin routes (returns 403).
- [x] IT Staff cannot access Admin routes (returns 403).

### C. Data Integrity & Business Rules
- [x] Status transitions validated server-side (BR-10).
- [x] Internal Notes not returned in Requester-facing API responses.
- [x] IDOR protection maintained from Lab 2 (Requester can only view own tickets).

### D. Code Quality & Architecture
- [x] Dev Requester Selector completely removed from all frontend routes and components.
- [x] No hardcoded `SESSION_SECRET` in source code (uses `.env`).
- [x] Password hashed with `bcrypt` (min 10 rounds) — never stored plain-text.

### E. Testing
- [x] All auth endpoints covered by automated tests.
- [x] All RBAC scenarios tested (Requester→IT, IT→Admin, Unauthenticated→Protected).
- [x] Lab 2 regression test suite still passes with real auth.

---

## 4. Review Log

| Date | PR | Reviewer | Action | Notes |
|---|---|---|---|---|
| 2026-10-04 | — | — | Spec docs created | Pre-implementation spec committed to `feature/lab3-spec` |
| 2026-10-04 | [#34](https://github.com/Patitta-23/LAB/pull/34) | @nannaphatkn | Approved & Merged | Spec DD documentation — all 6 docs reviewed and approved |
| 2026-10-04 | [#35](https://github.com/Patitta-23/LAB/pull/35) | @nannaphatkn | Approved & Merged | Auth system — session, RBAC, mustChangePassword flow verified |
| 2026-10-04 | [#36](https://github.com/Patitta-23/LAB/pull/36) | @nannaphatkn | Approved & Merged | IT Staff workflow — status transitions and internal notes access control verified |
| 2026-10-04 | [#37](https://github.com/Patitta-23/LAB/pull/37) | @nannaphatkn | Approved & Merged | Admin CRUD — duplicate email 409, BR-14 password reset verified |
| 2026-10-04 | [#38](https://github.com/Patitta-23/LAB/pull/38) | @nannaphatkn | Approved & Merged | Requester regression — Dev Selector removed, IDOR protection verified |
| 2026-10-04 | [#39](https://github.com/Patitta-23/LAB/pull/39) | @nannaphatkn | Changes Requested | toggle-active: ห้าม Admin ปิดบัญชีตัวเอง + ห้ามปิด Active Admin คนสุดท้าย; แก้ repo link LAB-01→LAB; เติมตารางที่ 2 |
| 2026-10-04 | [#39](https://github.com/Patitta-23/LAB/pull/39) | @Patitta-23 | Changes Applied | Fixed toggle-active with self-deactivation guard + last-admin guard; updated reviewer.md |
| 2026-10-04 | [#28](https://github.com/nannaphatkn/toktickit/pull/28) | @Patitta-23 | Reviewed & Approved (as reviewer) | Reviewed @nannaphatkn spec docs — approved |
| 2026-10-04 | [#29](https://github.com/nannaphatkn/toktickit/pull/29) | @Patitta-23 | Reviewed & Approved (as reviewer) | Reviewed @nannaphatkn auth system — approved |
| 2026-10-04 | [#32](https://github.com/nannaphatkn/toktickit/pull/32) | @Patitta-23 | Reviewed & Approved (as reviewer) | Reviewed @nannaphatkn IT Staff workflow — approved |
| 2026-10-04 | [#33](https://github.com/nannaphatkn/toktickit/pull/33) | @Patitta-23 | Reviewed & Approved (as reviewer) | Reviewed @nannaphatkn Admin management — approved |
| 2026-10-04 | [#36](https://github.com/nannaphatkn/toktickit/pull/36) | @Patitta-23 | Reviewed & Approved (as reviewer) | Reviewed @nannaphatkn Requester regression — approved |
