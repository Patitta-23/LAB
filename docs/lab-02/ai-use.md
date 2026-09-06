# Lab 2 — AI Use Log

**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334 — Full-Stack Web Development  
**Sprint:** Lab 2 — IT Service Desk Portal (Requester Side)

---

## 📊 Summary Table of Key Prompts (10 Selected Prompts)

Per course instructions, the table below summarizes **10 selected key prompts** used during the Lab 2 development lifecycle, detailing the task phase, prompt intent, AI output generated, and student verification/outcomes.

| # | Task Phase / Scope | User Prompt (Key Request) | AI Generated Output / Action | Student Verification & Outcome |
|---|---|---|---|---|
| 1 | **Spec-Driven Setup** | *"ช่วยวางแผน Spec-Driven Development และสร้างไฟล์เอกสาร specification.md, ui-spec.md, api-spec.md, tests.md, reviewer.md, ai-use.md สำหรับ Lab 2"* | Generated 5 baseline specification documents covering business rules, API endpoints, UI tokens, test matrix, and review templates. | Reviewed specs against lab instructions and committed them to Git before writing any code. |
| 2 | **Zen Green UI System** | *"ช่วยปรับแต่ง UI ทั้งหมดตาม Zen Green Design System ใน ui-spec.md โดยใช้ CSS Variables และ responsive layout"* | Created `client/src/index.css` with color tokens (`--color-primary`, `--color-surface`), component utility classes, and responsive breakpoints. | Verified UI layout across desktop, tablet, and mobile screen sizes using browser subagent & manual check. |
| 3 | **API Proxy & Routing** | *"ช่วยแก้ไขปัญหากดดึงข้อมูลแล้วเจอ SyntaxError: Unexpected token '<' ใน Frontend"* | Configured Vite development proxy in `vite.config.ts` and updated `api.ts` to use relative paths (`/api/...`). | Fixed CORS/HTML fallback errors; confirmed API requests route correctly to Express backend on port 3000. |
| 4 | **Section 8.1 Requester Screen** | *"ช่วยสร้างหน้า Development Requester Selection Screen ตาม Section 8.1 พร้อม breadcrumb, badge, dropdown และ Lab 3 notice"* | Created `SelectRequesterPage.tsx`, updated routing in `App.tsx`, added custom card styling, and wrote 7 Vitest component tests. | Verified element alignment against Section 8.1 mockup; all 7 Vitest tests passed cleanly. |
| 5 | **File Count Counter** | *"เวลาเพิ่มไฟล์อยากให้ตัวเลขบนหัวการ์ดขยับจาก 0 / 5 files เป็น 1 / 5 files"* | Implemented dynamic file state binding in `CreateTicketPage.tsx` to dynamically render file count `selectedFiles.length / MAX_FILES`. | Tested uploading multiple attachments; counter updates reactively from `0 / 5` up to `5 / 5 files`. |
| 6 | **Confirm Removal Modal** | *"อยากให้เวลาคลิกปุ่มกากบาท ลบไฟล์ แล้วมีหน้าต่างป๊อปอัปเด้งขึ้นมาบนหน้าจอเพื่อกด Confirm Remove และ Cancel"* | Built an interactive modal dialog with backdrop, file info summary, `Confirm Remove` action button, and `Cancel` button in `CreateTicketPage.tsx`. | Clicked file removal trigger; verified pop-up modal appears over UI and safely removes file only on confirm. |
| 7 | **My Tickets Table Upgrade** | *"อยากให้หน้ารวม My Tickets มี Ticket Number, Summary, Category, Current Status, Last Updated และ Search/Filter/Pagination"* | Enhanced `TicketListPage.tsx` with formatted ticket IDs (`#TK-1001`), 2-line summary clamp, category pills, status color badges, and ellipsis pagination. | Tested search query, status dropdowns, and ellipsis pagination (`1 ... 4 5 6 ... 10`) with live DB data. |
| 8 | **Detailed Peer Review Record** | *"ช่วยเขียนเพิ่ม PR links, comments given and received ลงใน reviewer.md แบบละเอียด"* | Expanded `docs/lab-02/reviewer.md` with GitHub PR links ([#19](https://github.com/Patitta-23/LAB-01/pull/19)–[#24](https://github.com/Patitta-23/LAB-01/pull/24)), detailed feedback logs, partner PR reviews, and DoD checklist. | Cross-checked PR links and feedback summaries against partner review records. |
| 9 | **README Documentation** | *"ช่วยเขียนเนื้อหา Lab2 ลงในไฟล์ README.md ให้หน่อย"* | Updated project `README.md` with Lab 2 overview, directory tree, API endpoint reference table (7 endpoints), and feature branch list. | Reviewed Markdown rendering on GitHub repository homepage for clarity and completeness. |
| 10 | **Build & Test Verification** | *"ช่วยรัน Vitest และ TypeScript build เพื่อตรวจสอบว่าโค้ดทั้งหมดผ่าน 100% ก่อน push ขึ้น GitHub"* | Executed `npm test` in client and server directories (36 server tests + 11 client tests) and ran `npm run build` verification. | Verified zero TypeScript compilation errors and 100% test pass rate prior to pushing to `origin main`. |

---

## 📝 Detailed Session Log

### Session 1 — 2026-09-03
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Git repository cleanup and Spec-Driven Development baseline setup.

**What I asked the AI:**
- Help clean dirty git state carried over from Lab 1.
- Guide the execution of Spec-Driven Development for Lab 2.
- Create 5 initial specification artifacts: `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md`.

**What the AI produced:**
- Step-by-step git commands to stash, recreate `lab2-staging`, and commit baseline files.
- 5 comprehensive Markdown specification documents in `docs/lab-02/`.

**What I changed or reviewed:**
- Verified git tree clean status.
- Reviewed business rules (BR-01 to BR-11) and acceptance criteria (AC-01 to AC-05) for accuracy.

**What I learned:**
- Spec-Driven Development requires committing specification documents to Git before writing production implementation code.

---

### Session 2 — 2026-09-06
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Zen Green UI implementation, Vite API proxy configuration, and PostgreSQL database setup.

**What I asked the AI:**
- Implement Zen Green color system tokens and responsive layouts.
- Resolve frontend API request failure (`SyntaxError: Unexpected token '<'`).
- Verify backend API endpoints connected to PostgreSQL database.

**What the AI produced:**
- `client/src/index.css` containing CSS custom variables and utility classes.
- Refactored `App.tsx`, `TicketListPage.tsx`, `CreateTicketPage.tsx`, `TicketDetailPage.tsx`, and `RequesterSelector.tsx`.
- Configured Vite proxy in `client/vite.config.ts` and relative endpoint routing in `api.ts`.

**What I changed or reviewed:**
- Inspected UI layout in browser across desktop and mobile viewports.
- Ran Vitest test runners (36 server tests + 4 client tests passed).

**What I learned:**
- Using Vite dev proxy with relative `/api/...` paths eliminates CORS issues and environment hardcoding.

---

### Session 3 — 2026-09-06
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Section 8.1 Required Development Requester Selection Screen & Component Tests.

**What I asked the AI:**
- Build the dedicated Development Requester Selection Screen specified in Section 8.1.
- Add breadcrumb navigation, user+gear icon badge, title, explanatory description, dropdown loaded from DB, Lab 3 notice box, and action buttons.
- Create automated Vitest component tests.

**What the AI produced:**
- `client/src/pages/SelectRequesterPage.tsx` with Zen Green styling.
- `client/tests/lab-02/SelectRequesterPage.test.tsx` containing 7 test cases.

**What I changed or reviewed:**
- Verified UI alignment against Section 8.1 specification mockup.
- Ran Vitest suite (all 7 Section 8.1 tests passed).

**What I learned:**
- Explicit development context selection screens prevent confusion before formal authentication (Lab 3) is implemented.

---

### Session 4 — 2026-09-07
**Tool used:** Antigravity (Google Deepmind)  
**Task:** Create Ticket attachment counter & confirm removal modal, My Tickets table upgrade, Peer Review log, and README update.

**What I asked the AI:**
- Add real-time file counter `0 / 5 files` on Create Ticket attachment header.
- Implement pop-up confirmation modal for attachment removal (`Confirm Remove` & `Cancel`).
- Upgrade My Tickets table with Ticket No., Summary, Category pill, Status color badge, Created Date with time, and Ellipsis pagination.
- Expand `reviewer.md` with GitHub PR links, detailed comments given and received, and DoD checklist.
- Write Lab 2 documentation in `README.md`.

**What the AI produced:**
- Modified `CreateTicketPage.tsx` with reactive attachment file counter and removal modal popup.
- Updated `TicketListPage.tsx` with formatted columns, filters, and pagination ellipsis logic.
- Expanded `docs/lab-02/reviewer.md` with detailed PR review tables.
- Updated `README.md` with Lab 2 architecture, endpoints table, and feature list.

**What I changed or reviewed:**
- Tested file upload counter and removal modal on local dev server (`http://localhost:5173/`).
- Verified zero TypeScript compilation errors and pushed all changes to `origin main`.

**What I learned:**
- Providing clear confirmation modals for destructive actions (file removal, soft-delete) significantly improves user safety and application UX.



