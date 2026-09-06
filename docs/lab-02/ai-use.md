# Lab 2 — AI Use Log

**Author:** Patitta Daensikaew — 67070505221  
**Course:** CPE 334  

---

## How to Use This Document

For every AI-assisted session, add an entry below. Record:
1. **What I asked the AI to do** — the prompt or task
2. **What the AI produced** — the output (code, text, plan, etc.)
3. **What I changed or reviewed** — how I verified, adapted, or corrected the AI output
4. **What I learned** — reflection on the session

---

## Session Log

### Session 1 — 2026-09-03
**Tool used:** Antigravity (Google Deepmind)

**Task:** Setting up Lab 2 git workflow and creating Spec DD documentation

**What I asked the AI:**
- Help fix the git state (uncommitted Lab 1 files carried over to lab2-staging)
- Guide the steps for Spec-Driven Development
- Create initial spec documents: specification.md, ui-spec.md, api-spec.md, tests.md, reviewer.md, ai-use.md

**What the AI produced:**
- Step-by-step git commands to clean up the dirty branch (stash → delete branch → commit on main → recreate branch)
- 5 specification documents covering business rules, functional requirements, acceptance criteria, API endpoints, UI design tokens, and test matrix

**What I changed or reviewed:**
- Verified git status after each command
- Reviewed spec content for accuracy against lab requirements

**What I learned:**
- Always commit or stash before switching branches to avoid carrying over changes
- Spec DD requires creating documentation with a git timestamp BEFORE writing any implementation code — this is how the spec serves as a contract

---

### Session 2 — 2026-09-06
**Tool used:** Antigravity (Google Deepmind)

**Task:** Implementing Zen Green UI, fixing Vite API proxy, and DB connection setup

**What I asked the AI:**
- Implement Zen Green color system and responsive UI according to `ui-spec.md`
- Fix frontend API error (`Unexpected token '<'`, `SyntaxError: Unexpected token '<'`)
- Ensure PostgreSQL container & Express backend are running properly and connected

**What the AI produced:**
- `index.css` design system with CSS custom properties (`--color-primary`, `--color-surface`, etc.)
- Refactored `App.tsx`, `TicketListPage.tsx`, `CreateTicketPage.tsx`, `TicketDetailPage.tsx`, `RequesterSelector.tsx`
- Vite proxy setup in `client/vite.config.ts` and updated `api.ts` to use relative endpoints (`/api/...`)
- Fixed backend environment startup script and database container initialization

**What I changed or reviewed:**
- Verified UI screens using Antigravity browser tool & manual browser inspection at `http://localhost:5173/`
- Ran `vitest` unit test suites for both client and server (36 server tests, 4 client tests passed)

**What I learned:**
- Using Vite proxy with relative paths (`/api/...`) prevents CORS and port hardcoding issues in development
- Docker daemon must be running for PostgreSQL containers to accept connections on port 5432

---

### Session 3 — 2026-09-06
**Tool used:** Antigravity (Google Deepmind)

**Task:** Implementing Section 8.1 Required Development Requester Selection Screen

**What I asked the AI:**
- Build the dedicated Development Requester Selection Screen required in Section 8.1 of the lab specification
- Ensure all required elements are present: breadcrumb, user+gear icon badge, title, explanatory text, dropdown loaded from PostgreSQL, info banner, Lab 3 auth notice, cancel/continue buttons, and safe error states
- Add unit tests for Section 8.1 and verify on browser

**What the AI produced:**
- Created `client/src/pages/SelectRequesterPage.tsx` with keyboard-accessible form controls and Zen Green design
- Added CSS styles in `client/src/index.css` for the card layout, badge, info banners, and Lab 3 notice box
- Updated `App.tsx` and `RequesterSelector.tsx` to route to and trigger the Development Requester Selection Screen
- Created `client/tests/lab-02/SelectRequesterPage.test.tsx` with 7 test cases covering all 8.1 acceptance requirements
- Verified via browser screenshot at `http://localhost:5173/`

**What I changed or reviewed:**
- Verified layout and element alignment against Section 8.1 mockup
- Executed full Vitest suite (36 server tests + 11 client tests passed)

**What I learned:**
- Providing dedicated development context selection screens with explicit testing notices prevents confusion before formal authentication (Lab 3) is implemented


