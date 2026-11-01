# Lab 4 — AI Use Log

**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334 — Full-Stack Web Development  
**Sprint:** Lab 4 — Ticket Detail & Action System

---

## 📊 Summary Table of Key Prompts

| # | Task Phase / Scope | User Prompt (Key Request) | AI Generated Output / Action | Student Verification & Outcome |
|---|---|---|---|---|
| 1 | **Spec-Driven Setup** | *"เริ่ม Phase 0 ได้เลย"* | Generated `lab4-staging` branch, created `docs/lab-04/` with 6 files: `specification.md` (BR-01..BR-14, FR-01..FR-10, AC-01..AC-14, Role Matrix, State Machine, DoD), `api-spec.md` (8 endpoints with full request/response/error specs), `ui-spec.md` (2 page layouts, 7 components), `tests.md` (50+ test cases across 8 files), `reviewer.md`, `ai-use.md`. Also created `feat/lab4-spec` branch and committed all docs. | Reviewed all spec content against Lab 4 image requirements; verified branch structure and commit history. |
| 2 | **Branch 1 — Claim/Reassign** | *"สร้าง Branch 1 feature/lab4-claim-reassign ได้เลย"* | Created `feature/lab4-claim-reassign` from `lab4-staging`. Implemented `POST /api/it-staff/tickets/:id/claim`, `PATCH /api/it-staff/tickets/:id/reassign`, `GET /api/it-staff/users` endpoints in `itStaffRoutes.ts`. Wrote 13 vitest tests (CLM-01..CLM-13). Pushed and opened PR #44. | Ran `npx vitest run tests/lab-04/claim-reassign.test.ts` → 13/13 ✅. Verified claim auto-sets status to IN_PROGRESS, reassign rejects non-IT-Staff users. |
| 3 | **Branch 2 — Status/Priority** | *"ทำ Branch 2 feature/lab4-status-priority ได้เลย"* | Created `feature/lab4-status-priority` from Branch 1. Implemented `PATCH /api/it-staff/tickets/:id/status` (state machine: OPEN→IN_PROGRESS, IN_PROGRESS→PENDING/RESOLVED/CLOSED, PENDING→IN_PROGRESS/RESOLVED, RESOLVED→CLOSED) and `PATCH /api/it-staff/tickets/:id/priority` (IT Staff + Admin only). Wrote 23 vitest tests (STS-01..STS-23). Pushed and opened PR #45. | Ran `npx vitest run tests/lab-04/status-transition.test.ts` → 23/23 ✅. Verified INVALID_TRANSITION 400, VALIDATION_ERROR 422, role restrictions 403. |
| 4 | **Branch 3 — Comments** | *"ทำ Branch 3 feature/lab4-comments ได้เลย"* | Created `feature/lab4-comments` from Branch 2. Implemented `POST /api/tickets/:id/comments` (PUBLIC/INTERNAL with RBAC), `GET /api/tickets/:id/comments` (merged chronological view with role filtering), `POST /api/tickets/:id/resolve` (Requester only, IDOR guard). Wrote 23 vitest tests (CMT-01..CMT-10, RSLV-01..RSLV-06+). Pushed and opened PR #46. | Ran all 23 comment tests → ✅. Verified Requester cannot post INTERNAL (CMT-04), IDOR on resolve (RSLV-05), idempotent resolve (RSLV-01c). |
| 5 | **Branch 4 — Requester Actions + RBAC** | *"ทำ Branch 4 feature/lab4-requester-actions ต่อได้เลย"* | Created `feature/lab4-requester-actions` from Branch 3. Added `requester-actions.test.ts` (RAC-01..RAC-07, 7 tests) and `rbac-lab4.test.ts` (RBAC-L4-01..RBAC-L4-09, 9 tests). Pushed and opened PR #47. | Ran all 16 new tests → ✅. Verified all RBAC boundaries across all 4 branches. |
| 6 | **Phase 3 — Role Restrictions & Safe Failure** | *"ลุยเลย"* | Added `code` fields to all error responses in `itStaffRoutes.ts` (INVALID_TRANSITION, VALIDATION_ERROR, INVALID_ASSIGNEE, UNAUTHENTICATED, NOT_FOUND). Unified comment section in `ItTicketDetailPage.tsx` with PUBLIC/INTERNAL toggle (FR-06). Added PENDING status badge to `ItQueuePage.tsx` and `TicketListPage.tsx`. Fixed `deleteMany` scope in 3 test files to prevent cross-test comment deletion. | Ran full test suite → 143/143 ✅. TypeScript `npx tsc --noEmit` → 0 errors on both client and server. Committed and pushed to `feature/lab4-requester-actions`. |
| 7 | **Phase 4 — Direct API Authorization Evidence & Client UI Tests** | *"โอเค ทำ Phase 4: Direct API Authorization Evidence ต่อเลย"* | Created client test suites for Lab 4: `ItStaffTicketDetail.test.tsx` (UI-IT-01..06, 7 tests), `RequesterTicketDetail.test.tsx` (UI-REQ-01..06, 6 tests), and `CommentSection.test.tsx` (UI-CMT-01..05, 5 tests). Validated RBAC in UI (toggle visibility, resolve button visibility, status transition dropdown restrictions). Updated `tests.md` with full pass counts. | Ran client tests → 41/41 ✅ (18 Lab 4 tests + 23 previous). Ran full test suite: 184/184 ✅ (143 server + 41 client). TypeScript `npx tsc --noEmit` clean on both sides. |
| 8 | **Phase 5 — Tests & Documentation Update** | *"ต่อ Phase 5: Tests & Documentation Update"* | Updated `reviewer.md` with active PR numbers (#41, #44, #45, #46, #47) and branch naming. Updated DoD in `specification.md` (AC-01..14 verified, server 143/143, client 41/41, regressions 0, specs committed). Verified end-to-end test execution across client and server. | Verified all documentation files in `docs/lab-04/` accurately reflect test metrics, PR statuses, and DoD completion. |

---

## 📝 Detailed Session Log

### Session 1 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Phase 0 — Git branch setup and Spec-Driven Development baseline documentation for Lab 4.

**What I asked the AI:**
> "เริ่ม Phase 0 ได้เลย" (Start Phase 0 now)

**What the AI did:**
1. Checked out `main` branch and confirmed it was up to date.
2. Created `lab4-staging` branch from `main`.
3. Created `docs/lab-04/` directory.
4. Generated all 6 spec documents with full content before any implementation code.
5. Created `feat/lab4-spec` branch and committed the docs.
6. Pushed both branches to GitHub.

**What I verified:**
- All 6 files in `docs/lab-04/` exist and have complete content.
- Branch `lab4-staging` visible on GitHub.
- Branch `feat/lab4-spec` visible on GitHub.
- PR opened for `feat/lab4-spec → lab4-staging`.

**Outcome:** ✅ Phase 0 complete. All spec docs committed before implementation begins.

---

### Session 2 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Branch 1 — Claim & Reassign implementation

**What I asked the AI:**
> "สร้าง Branch 1 feature/lab4-claim-reassign ได้เลย"

**What the AI did:**
1. Created `feature/lab4-claim-reassign` from `lab4-staging`.
2. Implemented `POST /api/it-staff/tickets/:id/claim` — IT Staff only, sets `assignedStaffId`, auto-transitions status `OPEN → IN_PROGRESS`.
3. Implemented `PATCH /api/it-staff/tickets/:id/reassign` — reassign to another IT Staff, validates user role.
4. Implemented `GET /api/it-staff/users` — returns all IT Staff users for dropdown population.
5. Wrote `server/tests/lab-04/claim-reassign.test.ts` with 13 tests (CLM-01..CLM-13).
6. Pushed branch and PR #44.

**What I verified:**
- All 13 tests pass (CLM-01..CLM-13).
- Claim correctly auto-sets status to `IN_PROGRESS`.
- Reassign rejects non-IT-Staff assignees (CLM-07).
- Admin cannot claim (CLM-09), Requester cannot claim (CLM-08).

**Outcome:** ✅ Branch 1 complete. 13/13 tests passing.

---

### Session 3 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Branch 2 — Status Transition State Machine & IT Priority

**What I asked the AI:**
> "ทำ Branch 2 feature/lab4-status-priority ได้เลย"

**What the AI did:**
1. Created `feature/lab4-status-priority` from Branch 1.
2. Implemented `PATCH /api/it-staff/tickets/:id/status` — state machine enforcement with `VALID_TRANSITIONS` map, IT Staff only.
3. Implemented `PATCH /api/it-staff/tickets/:id/priority` — IT Staff + Admin, validates against `VALID_PRIORITIES` (`LOW | MEDIUM | HIGH | CRITICAL`).
4. Added structured error codes: `INVALID_TRANSITION` (400), `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `UNAUTHENTICATED` (401), `FORBIDDEN` (403).
5. Wrote 23 tests (STS-01..STS-23).
6. Pushed and opened PR #45.

**What I verified:**
- All 23 tests pass. Valid transitions work; OPEN→RESOLVED blocked (STS-08); CLOSED is terminal (STS-10).
- Role restrictions correct: Requester→403 (STS-11), Admin→403 on status (STS-12), Admin→200 on priority (STS-18).

**Outcome:** ✅ Branch 2 complete. 23/23 tests passing.

---

### Session 4 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Branch 3 — Unified Comments & Resolve endpoint

**What I asked the AI:**
> "ทำ Branch 3 feature/lab4-comments ได้เลย"

**What the AI did:**
1. Created `feature/lab4-comments` from Branch 2.
2. Implemented `POST /api/tickets/:id/comments` — unified endpoint, PUBLIC stored in `PublicComment`, INTERNAL in `InternalNote`, Requester→PUBLIC only.
3. Implemented `GET /api/tickets/:id/comments` — merged + sorted chronological response, INTERNAL filtered for Requesters.
4. Implemented `POST /api/tickets/:id/resolve` — Requester only, own ticket only (IDOR guard), idempotent (RESOLVED stays RESOLVED).
5. Wrote 23 tests (CMT-01..CMT-10, RSLV-01..RSLV-01c).
6. Pushed and opened PR #46.

**What I verified:**
- CMT-04: Requester blocked from INTERNAL ✅. RSLV-05: IDOR blocked ✅. RSLV-01c: idempotent ✅.

**Outcome:** ✅ Branch 3 complete. 23/23 tests passing.

---

### Session 5 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Branch 4 — Requester Actions & RBAC Evidence

**What I asked the AI:**
> "โอเค ระหว่างรอ reviewer ทำ Branch 4: feat/lab4-requester-actions ต่อได้เลย"

**What the AI did:**
1. Created `feature/lab4-requester-actions` from Branch 3 (includes all previous changes).
2. Wrote `server/tests/lab-04/requester-actions.test.ts` — 7 tests (RAC-01..RAC-07) covering Requester resolve, IDOR, IT Staff blocked, Admin blocked, unauthenticated.
3. Wrote `server/tests/lab-04/rbac-lab4.test.ts` — 9 tests (RBAC-L4-01..RBAC-L4-09) as formal RBAC evidence suite.
4. Pushed and opened PR #47.

**What I verified:**
- RAC-04: IDOR blocked ✅. RAC-05/06: IT Staff + Admin blocked from resolve ✅.
- RBAC-L4-04: Admin cannot change status ✅. RBAC-L4-06: IT Staff cannot resolve ✅.

**Outcome:** ✅ Branch 4 complete. 7+9 = 16 tests passing. Total suite: 143/143.

---

### Session 6 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Phase 3 — Role Restrictions, Validation & Safe Failure

**What I asked the AI:**
> "ลุยเลย"

**What the AI did:**
1. Added `code` field to all error responses in `itStaffRoutes.ts` legacy endpoints:
   - `PATCH /api/it-staff/tickets/:id` → `INVALID_TRANSITION`, `VALIDATION_ERROR`, `INVALID_ASSIGNEE`
   - `POST /api/it-staff/tickets/:id/notes` → `VALIDATION_ERROR`, `UNAUTHENTICATED`, `NOT_FOUND`
2. Refactored `ItTicketDetailPage.tsx` — merged Public Comments + Internal Notes into single unified thread with PUBLIC/INTERNAL toggle buttons per FR-06. UI IDs: `toggle-comment-public`, `toggle-comment-internal`, `add-unified-comment`, `send-unified-comment`.
3. Added `PENDING` status badge to `ItQueuePage.tsx` and `TicketListPage.tsx`.
4. Fixed `deleteMany` scope in 3 test files (`comments.test.ts`, `rbac-lab4.test.ts`, `requester-actions.test.ts`) to filter by ticket title prefix instead of global `deleteMany()` — prevents cross-test data deletion during parallel runs.
5. Committed all changes and pushed to `feature/lab4-requester-actions`.

**What I verified:**
- Full test suite: 143/143 ✅ (ran `npx vitest run` with bypass sandbox).
- `npx tsc --noEmit` on both `server/` and `client/` → 0 errors ✅.
- Docker postgres restart policy set to `unless-stopped` to prevent future DB outages.

**Outcome:** ✅ Phase 3 complete. All code structured for error safety with no stack trace leakage.

---

### Session 7 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Phase 4 — Direct API Authorization Evidence & Client UI Tests

**What I asked the AI:**
> "โอเค ทำ Phase 4: Direct API Authorization Evidence ต่อเลย"

**What the AI did:**
1. Implemented client unit/integration tests for Lab 4:
   - `client/tests/lab-04/ItStaffTicketDetail.test.tsx` (UI-IT-01..06, 7 tests): verified title/badges render, Claim button appears when unassigned, "Assigned to you" badge appears when claimed, priority dropdown offers 4 valid levels, status dropdown only allows valid next transitions (OPEN → only IN_PROGRESS), and unified comment thread renders internal notes with lock badge.
   - `client/tests/lab-04/RequesterTicketDetail.test.tsx` (UI-REQ-01..06, 6 tests): verified title/category/status, "Problem Appears Resolved" button rendered when active (IN_PROGRESS) and hidden when terminal (CLOSED), Internal Note toggle absent, internal notes not visible, and confirmation modal appears before calling `/resolve` API.
   - `client/tests/lab-04/CommentSection.test.tsx` (UI-CMT-01..05, 5 tests): verified public comment render, IT Staff sees toggle buttons, Requester has no toggle, empty submission is disabled, and valid text submission clears input.
2. Verified all 41 client tests pass (18 Lab 4 + 23 previous).
3. Verified all 143 server tests pass (including RBAC evidence suite `rbac-lab4.test.ts`). Total: 184/184 tests pass across the entire codebase.
4. Updated `docs/lab-04/tests.md` with final test counts.

**What I verified:**
- Client tests: 41 / 41 passing ✅
- Server tests: 143 / 143 passing ✅
- Total test suite: 184 / 184 passing ✅
- TypeScript check: 0 errors on both client and server ✅

**Outcome:** ✅ Phase 4 complete. Direct API Authorization Evidence and Client UI Tests fully implemented and passing.

---

### Session 8 — 2026-11-01

**Tool used:** Antigravity (Google Deepmind)  
**Task:** Phase 5 — Tests & Documentation Update

**What I asked the AI:**
> "ต่อ Phase 5: Tests & Documentation Update"

**What the AI did:**
1. Updated `docs/lab-04/reviewer.md` with active PR tracking (#41, #44, #45, #46, #47) and canonical branch naming.
2. Updated Definition of Done (DoD) in `docs/lab-04/specification.md` marking off completed milestones (AC-01..14 verified, server 143/143 tests passing, client 41/41 tests passing, zero regression, specs & AI log finalized).
3. Synced `docs/lab-04/tests.md` with complete verification numbers.
4. Committed and pushed all documentation updates to `feature/lab4-requester-actions`.

**What I verified:**
- All 6 documentation files in `docs/lab-04/` are consistent and up-to-date.
- Total test coverage across system stands at 184/184 tests (100% passing).
- Repository is clean and in full readiness for peer review approval.

**Outcome:** ✅ Phase 5 complete. Documentation and DoD fully updated and synchronized.

---

## 💡 My Reflection: การใช้ AI ในบทบาท Specification Agent และ Coding Agent

### 1. AI ในบทบาท Specification Agent (การออกแบบและวางข้อกำหนดระบบ)
- **จุดเด่นและประโยชน์:** การใช้ AI ช่วยแปลงความต้องการระดับสูง (High-level Requirements) จากโจทย์ทางธุรกิจให้กลายเป็นข้อกำหนดทางวิศวกรรมซอฟต์แวร์ที่รัดกุมและเป็นรูปธรรม เช่น การจัดทำ Business Rules (BR-01..14), Acceptance Criteria (AC-01..14), Finite State Machine สำหรับสถานะ Ticket, และ Role-Based Access Control (RBAC) Matrix ทำให้การออกแบบครอบคลุมข้อยกเว้นและ Edge Cases สำคัญล่วงหน้า (อาทิ สิทธิ์การมองเห็น Internal Notes ที่ Requester ต้องไม่เห็น, การป้องกัน IDOR ใน Action Resolve, และพฤติกรรม Idempotent) ช่วยป้องกันปัญหา Scope Creep หรือการต้องแก้สถาปัตยกรรมกลางคัน
- **บทบาทของผู้พัฒนา (Human-in-the-Loop):** วิศวกรต้องทำหน้าที่เป็นผู้ตัดสินใจเชิงระบบ (System Architect) โดยตรวจสอบว่า Spec ที่ AI ร่างขึ้นนั้นสอดคล้องกับสถาปัตยกรรม Schema ฐานข้อมูลเดิม (Prisma / PostgreSQL) และกำหนดขอบเขตไม่ให้ AI นิยามฟังก์ชันที่ซับซ้อนเกินความจำเป็นของ Sprint

### 2. AI ในบทบาท Coding Agent (การพัฒนาโค้ดและชุดทดสอบอัตโนมัติ)
- **จุดเด่นและประโยชน์:** AI สามารถแปลง Spec ที่ชัดเจนมาเป็นโค้ดและชุดทดสอบอัตโนมัติ (Automated Tests) ตามแนวทาง Test-Driven Development (TDD) ได้อย่างรวดเร็วและแม่นยำ ครอบคลุมทั้ง Unit, Integration, UI และ RBAC Authorization Tests (รวม 184 tests ผ่าน 100%) นอกจากนี้ยังช่วยวิเคราะห์และแก้ไขปัญหาเชิงลึกได้อย่างมีประสิทธิภาพ เช่น การตรวจพบและแก้ไขปัญหา Concurrency Data Collision ระหว่างรัน Vitest แบบคู่ขนาน (การสโคป `deleteMany` แทน global truncate) และการจัดการ Safe Failure ไม่ให้เซิร์ฟเวอร์คืน Stack Trace รั่วไหล
- **บทบาทของผู้พัฒนา (Human-in-the-Loop):** วิศวกรต้องไม่ไว้วางใจผลลัพธ์ของ AI โดยปราศจากการตรวจสอบ แต่ต้องรันคำสั่งทดสอบจริงบน Terminal ทุกครั้ง ตรวจสอบ Coverage, ควบคุมระเบียบวินัยของ Git Branching, ตรวจสอบ Code Review / Feedback จาก Peer Reviewer, และแก้ไข Merge Conflicts เพื่อให้มั่นใจว่าโค้ดมีความปลอดภัย ไม่เกิด Regression และเป็นไปตาม Definition of Done (DoD) อย่างแท้จริง

### 3. บทสรุปภาพรวม (Key Takeaway)
การผสาน AI ทั้งสองบทบาทร่วมกับการกำกับดูแลของมนุษย์ (Spec-First Approach) แสดงให้เห็นว่า คุณภาพและความแม่นยำของโค้ดที่ Coding Agent สร้างขึ้นขึ้นอยู่กับความสมบูรณ์รัดกุมของเอกสารที่ Specification Agent กำหนดไว้ตั้งแต่ต้นโดยตรง การทำงานเป็นลำดับขั้นเช่นนี้ช่วยลดเวลาในการ Debugging เพิ่มความมั่นใจในการส่งมอบงาน และสร้างซอฟต์แวร์ที่มีความน่าเชื่อถือสูงตามมาตรฐานสากล




