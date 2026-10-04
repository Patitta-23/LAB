# Lab 3 — AI Use Log

**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334 — Full-Stack Web Development  
**Sprint:** Lab 3 — Authentication, IT Staff Workflow & Admin Management

---

## 📊 Summary Table of Key Prompts (6–10 Selected Prompts)

| # | Task Phase / Scope | User Prompt (Key Request) | AI Generated Output / Action | Student Verification & Outcome |
|---|---|---|---|---|
| 1 | **Spec-Driven Setup** | *"ช่วยสร้างโฟลเดอร์ docs/lab-03/ และร่างไฟล์เอกสารทั้ง 6 ไฟล์"* | Generated 6 baseline specification documents covering business rules (BR-01..BR-15), functional requirements (FR-01..FR-08), AC (AC-01..AC-10), API endpoints, UI design tokens, test matrix, and review templates. | Reviewed spec content against lab requirements and committed to `feature/lab3-spec` before writing any implementation code. |
| 2 | **Authentication Backend** | *"ต่อ (Implement Feature 1 Authentication & User Session)"* | Extended Prisma schema with `User` & `Session` models, bcrypt password hashing, express-session middleware, `requireAuth`/`requireRole` RBAC guards, auth routes (`/login`, `/logout`, `/me`, `/change-password`), and 9 integration tests. | Verified all 9 auth tests pass including inactive user rejection and mandatory password change redirect. |
| 3 | **IT Staff Workflow** | *"ต่อ (Implement Feature 2 IT Staff Queue & Notes)"* | Created IT Staff ticket queue endpoint with multi-field search/filters, ticket claim/assign endpoint, BR-10 status transition validator, IT priority updater, public comments, and IT-only internal notes endpoint with integration tests. | Verified IT Staff can manage tickets, internal notes stored securely, invalid status transitions return 400 Bad Request. |
| 4 | **Admin User Management** | *"ต่อ (Implement Feature 3 Administrator User Management)"* | Created Admin User CRUD routes (list, create, edit, toggle-active, reset-password), RBAC guard requiring `Administrator` role, and 10 integration tests. | Verified Admin can manage user lifecycle, duplicate email returns 409, deactivated user cannot log in, Requester/IT Staff get 403. |
| 5 | **Frontend Implementation** | *"ต่อ (Implement Frontend Auth & Role-based UI)"* | Created `AuthContext.tsx`, `NavBar.tsx`, `LoginPage.tsx`, `ChangePasswordPage.tsx`, `ItQueuePage.tsx`, `ItTicketDetailPage.tsx`, `AdminUsersPage.tsx`, and 23 client component tests. | Verified all 23 client tests pass, role-based routing works, and Dev Requester Selector completely removed. |
| 6 | **PR Process & Workflow** | *"เปิด Pull Requests บน GitHub"* | Reset `lab3-staging` to base commit, created 5 PR links (feature/* → lab3-staging), provided PR titles and body templates for `@nannaphatkn` review. | Verified all 5 PRs (#34–#38) created with correct base branch, reviewed and merged in order. |
| 7 | **Reviewer Feedback Fix** | *"ช่วยแก้ให้หน่อย (toggle-active guards)"* | Added 2 safety guards to `adminRoutes.ts` toggle-active: (1) Admin cannot deactivate own account, (2) Cannot deactivate last active Administrator. Updated `reviewer.md` with PR #39, partner PRs #28/#29/#32/#33/#36, and fixed repo link. | Verified code change is correct, committed and pushed. PR #39 re-approved and merged to `main` by `@nannaphatkn`. |

---

## 📝 Detailed Session Log

### Session 1 — 2026-10-04
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Setting up Lab 3 Git branches and creating Spec-Driven Development baseline documentation.

**What I asked the AI:**
- Create Git branches `lab3-staging` and `feature/lab3-spec` from `main`.
- Create `docs/lab-03/` folder with all 6 Spec DD documents pre-populated with Lab 3 content.

**What the AI produced:**
- Ran `git checkout -b lab3-staging` and `git push -u origin lab3-staging`.
- Ran `git checkout -b feature/lab3-spec` and `git push -u origin feature/lab3-spec`.
- Created `docs/lab-03/specification.md` — 15 business rules (BR-01 to BR-15), 8 functional requirements (FR-01 to FR-08), 10 acceptance criteria (AC-01 to AC-10), and Definition of Done checklist.
- Created `docs/lab-03/ui-spec.md` — Extended Zen Green design tokens, 5 screen wireframes (Login, Password Change, IT Staff Queue, IT Staff Ticket Detail, Admin User Management), responsive breakpoints.
- Created `docs/lab-03/api-spec.md` — 19 REST API endpoint specs with request/response examples and error format.
- Created `docs/lab-03/tests.md` — Test matrix with 50+ test cases across Auth, RBAC, IT Staff, Admin, UI Component, and Regression categories.
- Created `docs/lab-03/reviewer.md` — PR log template with security/auth/RBAC review checklist.
- Created `docs/lab-03/ai-use.md` — This document.

**What I changed or reviewed:**
- Reviewed business rules against Lab 3 requirements (Authentication must replace Dev Selector, 3-role system, IT Priority levels, status transition rules).
- Verified API endpoint structure matches the functional requirements.
- Confirmed all 6 files created correctly in `docs/lab-03/`.

**What I learned:**
- Starting Lab 3 with a comprehensive Spec DD baseline (created before any implementation code) provides a clear contract for all subsequent development decisions including authentication design, database schema, and UI layout.
- The Spec DD must have a Git commit timestamp earlier than any implementation code commit.

---

### Session 2 — 2026-10-04
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Implementing authentication backend, IT Staff workflow, Admin management, and Requester regression.

**What I asked the AI:**
- Implement session-based authentication with bcrypt and RBAC middleware.
- Implement IT Staff ticket queue, claim/assign, status transitions, internal notes.
- Implement Administrator user CRUD, toggle-active, reset-password.
- Implement Requester regression with public comments and "Problem Appears Resolved".

**What the AI produced:**
- `server/prisma/schema.prisma`: Added `User` model (email, passwordHash, role, mustChangePassword, isActive, lastLoginAt) and `Session` model.
- `server/src/middleware/authMiddleware.ts`: `requireAuth` and `requireRole(role)` RBAC guards.
- `server/src/routes/authRoutes.ts`: Login, logout, `/me`, change-password endpoints.
- `server/src/routes/itStaffRoutes.ts`: Ticket queue with filters, assign, priority, status transitions (BR-10), comments, internal notes.
- `server/src/routes/adminRoutes.ts`: User CRUD (list, create, edit, toggle-active, reset-password) with RBAC.
- `server/src/routes/commentRoutes.ts`: Public comments for Requester and IT Staff.
- `server/tests/lab-03/`: auth.test.ts (9 tests), itstaff.test.ts, admin.test.ts (10 tests), requester.test.ts.

**What I changed or reviewed:**
- Verified all server integration tests pass (68/68).
- Confirmed BR-10 status transition rules are enforced (invalid transitions return 400).
- Confirmed internal notes are not accessible via Requester-facing endpoints.
- Confirmed inactive users receive 401 on login attempt.

**What I learned:**
- Express-session requires careful configuration of `saveUninitialized: false` and `resave: false` to avoid session proliferation.
- Bcrypt's `compare()` is safe against timing attacks, making it appropriate for password verification.

---

### Session 3 — 2026-10-04
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Implementing frontend role-based UI screens and component tests.

**What I asked the AI:**
- Create AuthContext, NavBar, LoginPage, ChangePasswordPage.
- Create ItQueuePage (ticket queue with filters), ItTicketDetailPage.
- Create AdminUsersPage with CRUD modals.
- Write 23 client component tests with Vitest + React Testing Library.

**What the AI produced:**
- `client/src/context/AuthContext.tsx` — Global auth state provider.
- `client/src/components/NavBar.tsx` — Role-aware navigation bar.
- `client/src/pages/LoginPage.tsx`, `ChangePasswordPage.tsx` — Auth screens.
- `client/src/pages/ItQueuePage.tsx`, `ItTicketDetailPage.tsx` — IT Staff screens.
- `client/src/pages/AdminUsersPage.tsx` — Admin user management with modals.
- `client/src/App.tsx` — Updated routes with auth guards, Dev Requester Selector removed.
- `client/tests/lab-03/`: 23 component tests covering all new screens.

**What I changed or reviewed:**
- Verified all 23 client component tests pass.
- Confirmed `RequesterSelector` component and `x-user-id` header completely removed from all files.
- Verified role-based routing: Requester → ticket list, IT Staff → queue, Admin → user management.

**What I learned:**
- React Testing Library's `renderWithProviders` pattern makes auth-context-dependent components much easier to test.
- Route guards using `AuthContext` must handle the loading state to avoid redirect flicker.

---

### Session 4 — 2026-10-04
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Creating GitHub Pull Requests, managing branch workflow, and peer review process.

**What I asked the AI:**
- Create PR links for feature branches → lab3-staging.
- Reset `lab3-staging` to base commit (after discovering branches were merged without PRs).
- Generate PR titles and body templates for peer review by `@nannaphatkn`.

**What the AI produced:**
- Identified that feature branches were merged directly without PRs (using `git log --oneline main..lab3-staging`).
- Reset `lab3-staging` to `bac43e7` (= `main` HEAD) with `git reset --hard` and `git push --force`.
- Generated PR comparison URLs and body templates for all 5 feature branches.
- PR #34 (spec), #35 (auth), #36 (it-staff), #37 (admin), #38 (requester) — all targeting `lab3-staging`.

**What I changed or reviewed:**
- Verified force push succeeded: `lab3-staging` reset to same state as `main`.
- Verified all 5 feature branches still intact after reset.
- Confirmed all 5 PRs created with correct base branch `lab3-staging`.
- Confirmed `@nannaphatkn` approved and merged all PRs (#34–#38) into `lab3-staging`.
- Opened PR #39: `lab3-staging → main` as release candidate.

**What I learned:**
- `git reset --hard` also resets the working directory — need to restore untracked files with `git checkout <branch> -- <path>` after force push.
- Feature PRs should always target the staging branch, not `main`, to allow sequential review before release.

---

### Session 5 — 2026-10-04
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Addressing peer reviewer feedback on PR #39 — security guards for toggle-active endpoint.

**What I asked the AI:**
- Fix `adminRoutes.ts` toggle-active: add guard against Admin deactivating their own account.
- Fix `adminRoutes.ts` toggle-active: add guard against deactivating the last active Administrator.
- Update `reviewer.md` with: PR #39 number, fix repo link LAB-01→LAB, fill Section 2 with partner PRs.

**What the AI produced:**
- Added Guard 1 in `toggle-active`: checks `req.session.userId === userId` → returns 400 "You cannot deactivate your own account."
- Added Guard 2 in `toggle-active`: counts active Administrators → returns 400 "Cannot deactivate the last active Administrator." if count ≤ 1.
- Updated `reviewer.md`: repo link fixed, PR #39 added to table 1, table 2 filled with `@nannaphatkn`'s PRs (#28, #29, #32, #33, #36), review log expanded with all actions.
- Committed and pushed to `lab3-staging`.

**What I changed or reviewed:**
- Reviewed the generated guards for correctness — verified `sessionUserId` type cast is correct.
- Confirmed `@nannaphatkn` re-approved PR #39 after the fix.
- Merged PR #39 (`lab3-staging → main`) — Lab 3 release complete.

**What I learned:**
- Peer review is essential for catching security gaps — the self-deactivation and last-admin-lock scenarios were valid security concerns that automated tests had not covered.
- Always verify role-based business rules include edge cases (e.g., "last admin" scenario) not just happy paths.
