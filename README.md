# TokTickIT

**Internal IT Service Desk Portal** — Lab 1, Lab 2, Lab 3 & Lab 4 submission for CPE 334 full-stack web development course.

## Overview

TokTickIT is an enterprise IT service desk portal allowing employees and IT personnel to submit, track, manage, and resolve IT support tickets with end-to-end security, role-based workflows, and automated testing.

- **Lab 1:** Project foundation setup (health check, database seed, and category listing).
- **Lab 2:** Requester-side ticketing workflow: creating tickets with file attachments, personal ticket list with search/filter/sort, and ticket details with soft-delete attachment management.
- **Lab 3:** Full enterprise authentication & role-based management:
  - **Authentication & RBAC:** Express-session with httpOnly cookies, bcrypt password hashing, and role-based route guards (`Requester`, `IT Staff`, `Administrator`).
  - **Mandatory Password Change:** Forced first-login password update when `mustChangePassword = true`.
  - **IT Staff Workflow:** Ticket queue, status transition validator, ticket claiming/assignment, IT priority management, public comments, and IT-only internal notes.
  - **Administrator Management:** User lifecycle management (CRUD), account activation toggle with safety guards, and password resets.
  - **Dev Selector Removal:** Complete removal of the temporary Lab 2 Dev Requester Selector in favor of real authenticated sessions.
- **Lab 4:** Actions Taken, Dashboards, and Final Regression:
  - **Ticket Claim & Reassign:** IT Staff claim with automatic `OPEN` → `IN_PROGRESS` transition, reassign dropdown with active IT Staff list API.
  - **Status State Machine & Priority:** Strict status transition state machine enforcement (`OPEN` → `IN_PROGRESS` → `PENDING` / `RESOLVED` / `CLOSED`), IT Priority update with RBAC (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - **Unified Comments & Requester Resolve:** Unified comments thread supporting Public Comments and Internal Notes with role filtering, Requester "Problem Appears Resolved" action with IDOR guard.
  - **Safe Failure & Error Codes:** Structured error envelopes `{ "error": "...", "code": "..." }` across all endpoints with zero stack trace leakage.
  - **Comprehensive Automated Testing:** 184 passing automated tests across client and server with zero regression.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Bootstrap 5 |
| Backend | Node.js, Express, TypeScript, `express-session`, `bcrypt` |
| Database | PostgreSQL (via Docker) |
| ORM | Prisma |
| Testing | Vitest, Supertest, React Testing Library |

---

## Project Structure

```
toktickit/
├── client/                        # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx                # Role-based routing + layout shell
│   │   ├── api.ts                 # Typed API client (credentials: 'include')
│   │   ├── index.css              # Zen Green design system tokens & responsive CSS
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Global user session & authentication state
│   │   ├── components/
│   │   │   └── NavBar.tsx         # Role-aware navigation bar with user badge
│   │   └── pages/
│   │       ├── LoginPage.tsx          # Login screen
│   │       ├── ChangePasswordPage.tsx # Mandatory first-login password change
│   │       ├── TicketListPage.tsx     # Requester: My Tickets list
│   │       ├── CreateTicketPage.tsx   # Requester: Create Ticket form
│   │       ├── TicketDetailPage.tsx   # Requester: Ticket detail & comments
│   │       ├── ItQueuePage.tsx        # IT Staff: Ticket queue with multi-filter
│   │       ├── ItTicketDetailPage.tsx # IT Staff: Ticket detail & internal notes
│   │       └── AdminUsersPage.tsx     # Admin: User management & CRUD modals
│   └── tests/
│       ├── lab-01/                # Lab 1 client tests
│       ├── lab-02/                # Lab 2 client tests
│       ├── lab-03/                # Lab 3 client component tests
│       └── lab-04/                # Lab 4 client UI tests (18 tests)
│           ├── ItStaffTicketDetail.test.tsx
│           ├── RequesterTicketDetail.test.tsx
│           └── CommentSection.test.tsx
├── server/                        # Express backend (TypeScript)
│   ├── src/
│   │   ├── app.ts                 # Express app configuration & middleware
│   │   ├── index.ts               # Server entry point
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts  # requireAuth & requireRole RBAC middleware
│   │   └── routes/
│   │       ├── authRoutes.ts      # Authentication & password management
│   │       ├── itStaffRoutes.ts   # IT Staff queue, claim, reassign, status, priority
│   │       ├── adminRoutes.ts     # User CRUD & admin lifecycle
│   │       └── commentRoutes.ts   # Unified comments, internal notes & resolve action
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema (User, Session, Category, Ticket, Attachment, Note, Comment)
│   │   └── seed.ts                # Default seed data (Users, Categories, Tickets)
│   ├── uploads/                   # Stored attachment files
│   └── tests/
│       ├── lab-01/                # Health & category tests
│       ├── lab-02/                # Lab 2 API integration tests
│       ├── lab-03/                # Lab 3 integration tests
│       └── lab-04/                # Lab 4 feature integration tests (75 tests)
│           ├── claim-reassign.test.ts
│           ├── status-transition.test.ts
│           ├── comments.test.ts
│           ├── requester-actions.test.ts
│           └── rbac-lab4.test.ts
└── docs/
    ├── lab-01/
    ├── lab-02/
    ├── lab-03/
    └── lab-04/                    # Lab 4 Spec-Driven Development documentation
        ├── specification.md       # Engineering spec, BR-01..14, FR-01..10, AC-01..14, DoD
        ├── api-spec.md            # REST API endpoints, Request/Response, RBAC
        ├── ui-spec.md             # IT Staff & Requester layouts, components, responsive
        ├── tests.md               # 50+ planned test cases and verification metrics
        ├── reviewer.md            # Peer review tracking with @nannaphatkn
        └── ai-use.md              # AI Sessions 1-8 Prompts & Reflection
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Docker Desktop (for PostgreSQL)

### 1. Database Setup

```bash
# Start PostgreSQL via Docker
docker run --name postgres -e POSTGRES_USER=toktickit -e POSTGRES_PASSWORD=toktickit -e POSTGRES_DB=toktickit -p 5432:5432 -d postgres:15

# Alternatively, if the container already exists:
docker start postgres
```

### 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Run database migrations and seed
npx prisma db push
npm run prisma:seed

# Start development server (runs on http://localhost:3000)
npm run dev
```

### 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

---

## Test User Accounts (Seed Data)

All accounts share the initial default password: `Password1` (or `Password123!` depending on seed script)

| Role | Email | Description |
|---|---|---|
| **Administrator** | `carol@toktick.it` | Full user management, account activation, password reset |
| **IT Staff** | `bob@toktick.it` | Ticket queue, claim/reassign tickets, internal notes, status/priority |
| **Requester** | `alice@toktick.it` | Create tickets, view personal tickets, public comments, resolve own tickets |

---

## API Endpoints Summary

### Authentication & Account (`/api/auth`)

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| POST | `/api/auth/login` | No | Authenticate user & establish session |
| POST | `/api/auth/logout` | Yes | Destroy current session |
| GET | `/api/auth/me` | Yes | Get authenticated user profile & role |
| POST | `/api/auth/change-password` | Yes | Update password and clear `mustChangePassword` |

### IT Staff Operations (`/api/it-staff`)

| Method | Path | Role Required | Description |
|--------|------|:---:|-------------|
| GET | `/api/it-staff/tickets` | IT Staff / Admin | Queue with search, category/status/priority/assignee filters |
| GET | `/api/it-staff/tickets/:id` | IT Staff / Admin | Complete ticket detail including internal notes |
| POST | `/api/it-staff/tickets/:id/claim` | IT Staff | Claim ticket (auto `OPEN` → `IN_PROGRESS`) |
| PATCH | `/api/it-staff/tickets/:id/reassign` | IT Staff / Admin | Reassign ticket to another active IT Staff member |
| GET | `/api/it-staff/users` | IT Staff / Admin | List IT Staff members for reassign dropdown |
| PATCH | `/api/it-staff/tickets/:id/priority` | IT Staff / Admin | Update IT Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| PATCH | `/api/it-staff/tickets/:id/status` | IT Staff | Transition status per strict state machine |
| POST | `/api/it-staff/tickets/:id/notes` | IT Staff / Admin | Add internal note (hidden from requesters) |

### Administrator Management (`/api/admin`)

| Method | Path | Role Required | Description |
|--------|------|:---:|-------------|
| GET | `/api/admin/users` | Administrator | List users with search, role filter, status filter |
| POST | `/api/admin/users` | Administrator | Create user (`mustChangePassword = true`) |
| PATCH | `/api/admin/users/:id` | Administrator | Update user name, email, or role |
| PATCH | `/api/admin/users/:id/toggle-active` | Administrator | Activate/Deactivate user with safety guards |
| POST | `/api/admin/users/:id/reset-password` | Administrator | Reset password (`mustChangePassword = true`) |

### Comments & Ticket Actions (`/api/tickets`)

| Method | Path | Role Required | Description |
|--------|------|:---:|-------------|
| POST | `/api/tickets` | Requester | Create new ticket (multipart/form-data) |
| GET | `/api/tickets` | Requester | List personal tickets (isolated per authenticated user) |
| GET | `/api/tickets/:id` | Requester | View personal ticket detail (IDOR-protected) |
| GET | `/api/tickets/:id/comments` | Authenticated | Unified comments list (INTERNAL hidden from Requesters) |
| POST | `/api/tickets/:id/comments` | Authenticated | Add comment (PUBLIC for all, INTERNAL for IT Staff/Admin) |
| POST | `/api/tickets/:id/resolve` | Requester | Requester marks ticket as resolved ("Problem Appears Resolved") |

---

## Running Automated Tests

```bash
# Run server test suite (143 tests passing — 100%)
cd server && npm test

# Run client test suite (41 tests passing — 100%)
cd client && npm test

# Run specific test suite
cd server && npx vitest run tests/lab-04/
cd client && npx vitest run tests/lab-04/
```

### Test Suite Summary

```
Server Tests: 143 / 143 passing (15 test files)
Client Tests:  41 /  41 passing (9 test files)
Total Tests:  184 / 184 passing (100% PASS, 0 failures)
TypeScript:   0 errors (npx tsc --noEmit)
```

---

## Lab 4 — Feature Branches & Pull Requests

| PR # | Branch | Target | Description | Status |
|:---:|---|---|---|:---:|
| [#41](https://github.com/Patitta-23/LAB/pull/41) | `feature/lab4-spec` | `lab4-staging` | Spec-Driven Development baseline documentation (6 docs) | ✅ Merged |
| [#44](https://github.com/Patitta-23/LAB/pull/44) | `feature/lab4-claim-reassign` | `lab4-staging` | Ticket claim with auto IN_PROGRESS, reassign, IT Staff list API | ✅ Merged |
| [#45](https://github.com/Patitta-23/LAB/pull/45) | `feature/lab4-status-priority` | `lab4-staging` | State machine status transitions and IT Priority management | ✅ Merged |
| [#46](https://github.com/Patitta-23/LAB/pull/46) | `feature/lab4-comments` | `lab4-staging` | Unified comments thread (PUBLIC/INTERNAL) & requester resolve action | ✅ Merged |
| [#47](https://github.com/Patitta-23/LAB/pull/47) | `feature/lab4-requester-actions` | `lab4-staging` | Requester actions, RBAC evidence suites, and 18 client UI tests | ✅ Merged |
| [#54](https://github.com/Patitta-23/LAB/pull/54) | `lab4-staging` | `main` | Final Lab 4 consolidation into main with full regression check | ✅ Merged |

---

## Author & Peer Reviewer

- **Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)
- **Peer Reviewer:** Nannaphat Kaenphanao — 67070505219 — GitHub: [@nannaphatkn](https://github.com/nannaphatkn)
