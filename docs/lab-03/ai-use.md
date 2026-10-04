# Lab 3 — AI Use Log

**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334 — Full-Stack Web Development  
**Sprint:** Lab 3 — Authentication, IT Staff Workflow & Admin Management

---

## 📊 Summary Table of Key Prompts (6–10 Selected Prompts)

Per course instructions, the table below summarizes selected key prompts used during the Lab 3 development lifecycle. *(This table will be updated as implementation progresses.)*

| # | Task Phase / Scope | User Prompt (Key Request) | AI Generated Output / Action | Student Verification & Outcome |
|---|---|---|---|---|
| 1 | **Spec-Driven Setup** | *"ช่วยสร้างโฟลเดอร์ docs/lab-03/ และร่างไฟล์เอกสารทั้ง 6 ไฟล์ (specification.md, ui-spec.md, api-spec.md, tests.md, reviewer.md, ai-use.md) ให้เลย"* | Generated 6 baseline specification documents covering business rules, functional requirements, AC, API endpoints, UI design tokens, test matrix, and review templates. | Reviewed spec content against lab requirements and committed to `feature/lab3-spec` before writing any implementation code. |
| 2 | *(TBD — Authentication)* | *(Record prompt when implementing auth)* | *(AI output)* | *(Verification steps)* |
| 3 | *(TBD — IT Staff Queue)* | *(Record prompt when implementing IT Staff screens)* | *(AI output)* | *(Verification steps)* |
| 4 | *(TBD — IT Staff Ticket Detail)* | *(Record prompt when implementing ticket detail)* | *(AI output)* | *(Verification steps)* |
| 5 | *(TBD — Admin User Management)* | *(Record prompt when implementing admin screen)* | *(AI output)* | *(Verification steps)* |
| 6 | *(TBD — Requester Regression)* | *(Record prompt when removing Dev Selector & adding Public Comments)* | *(AI output)* | *(Verification steps)* |

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

> *(Add new session entries here as implementation progresses throughout Lab 3.)*
