# TokTickIT

**Internal IT Service Desk Portal** — Lab 1, Lab 2 & Lab 3 submission for full-stack web development course.

## Overview

TokTickIT is a web application that allows employees to submit, track, and manage IT support tickets with enterprise-grade security and role-based workflows.

- **Lab 1:** Foundation setup (health check + category listing).
- **Lab 2:** Requester-side ticketing workflow: creating tickets with file attachments, personal ticket list with search/filter/sort, and ticket details with soft-delete attachment management.
- **Lab 3:** Full enterprise authentication & role-based management:
  - **Authentication & RBAC:** Express-session with httpOnly cookies, bcrypt password hashing, and role-based route guards (`Requester`, `IT Staff`, `Administrator`).
  - **Mandatory Password Change:** Forced first-login password update when `mustChangePassword = true`.
  - **IT Staff Workflow:** Comprehensive ticket queue, status transition validator (BR-10), ticket claiming/assignment, IT priority management, public comments, and IT-only internal notes.
  - **Administrator Management:** User lifecycle management (CRUD), account activation toggle with self-deactivation & last-admin guards, and password resets.
  - **Dev Selector Removal:** Complete removal of the temporary Lab 2 Dev Requester Selector in favor of real authenticated sessions.

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
│       ├── lab-01/App.test.tsx
│       ├── lab-02/SelectRequesterPage.test.tsx
│       └── lab-03/                # Lab 3 client component tests (23 tests)
├── server/                        # Express backend (TypeScript)
│   ├── src/
│   │   ├── app.ts                 # Express app configuration & middleware
│   │   ├── index.ts               # Server entry point
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts  # requireAuth & requireRole RBAC middleware
│   │   └── routes/
│   │       ├── authRoutes.ts      # Authentication & password management
│   │       ├── itStaffRoutes.ts   # IT Staff queue, assignment, notes
│   │       ├── adminRoutes.ts     # User CRUD & admin lifecycle
│   │       └── commentRoutes.ts   # Public comments & resolution
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema (User, Session, Category, Ticket, Attachment, Note, Comment)
│   │   └── seed.ts                # Default seed data (Users, Categories, Tickets)
│   ├── uploads/                   # Stored attachment files
│   └── tests/
│       ├── lab-01/                # Health & category tests
│       ├── lab-02/                # Lab 2 API integration tests
│       └── lab-03/                # Lab 3 integration tests (68 tests total)
└── docs/
    ├── lab-01/
    ├── lab-02/
    └── lab-03/                    # Spec-Driven Development documentation
        ├── specification.md       # Engineering spec, BR-01..15, FR-01..08, AC-01..10
        ├── ui-spec.md             # UI/UX wireframes & responsive breakpoints
        ├── api-spec.md            # REST API endpoints & payload specifications
        ├── tests.md               # Test matrix & verification strategy
        ├── reviewer.md            # Peer review record & PR log
        └── ai-use.md              # AI prompt log & audit trail
```

---

## Prerequisites

- Node.js ≥ 18
- Docker Desktop

---

## Setup & Run

### 1. Start the database

```bash
docker run -d --name postgres \
  -e POSTGRES_USER=toktickit \
  -e POSTGRES_PASSWORD=toktickit \
  -e POSTGRES_DB=toktickit \
  -p 5432:5432 postgres:15
```

> If the container already exists: `docker start postgres`

### 2. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Configure environment variables

```bash
# server/.env
cp server/.env.example server/.env

# client/.env
cp client/.env.example client/.env
```

### 4. Run database migration and seed

```bash
cd server
npx prisma db push
npx prisma db seed
```

### 5. Start development servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

Open **http://localhost:5173** to access the login portal.

---

## Default User Accounts (Lab 3 Seed)

All accounts share the initial default password: `Password123!`

| Role | Email | Initial Password | Description |
|---|---|---|---|
| **Administrator** | `carol@toktick.it` | `Password123!` | Full user management, account activation, password reset |
| **IT Staff** | `bob@toktick.it` | `Password123!` | Ticket queue, claim/assign tickets, internal notes |
| **Requester** | `alice@toktick.it` | `Password123!` | Create tickets, view personal tickets, public comments |

---

## API Endpoints

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
| POST | `/api/it-staff/tickets/:id/claim` | IT Staff | Claim ticket (assign to current IT Staff) |
| PATCH | `/api/it-staff/tickets/:id/assign` | IT Staff / Admin | Assign ticket to another active IT Staff member |
| PATCH | `/api/it-staff/tickets/:id/priority` | IT Staff / Admin | Update IT Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| PATCH | `/api/it-staff/tickets/:id/status` | IT Staff / Admin | Transition status per BR-10 validation rules |
| POST | `/api/it-staff/tickets/:id/notes` | IT Staff / Admin | Add internal note (hidden from requesters) |

### Administrator Management (`/api/admin`)

| Method | Path | Role Required | Description |
|--------|------|:---:|-------------|
| GET | `/api/admin/users` | Administrator | List users with search, role filter, status filter |
| POST | `/api/admin/users` | Administrator | Create user (`mustChangePassword = true`) |
| PATCH | `/api/admin/users/:id` | Administrator | Update user name, email, or role |
| PATCH | `/api/admin/users/:id/toggle-active` | Administrator | Activate/Deactivate user with safety guards |
| POST | `/api/admin/users/:id/reset-password` | Administrator | Reset password (`mustChangePassword = true`) |

### Requester & Ticket Management (`/api/tickets`)

| Method | Path | Role Required | Description |
|--------|------|:---:|-------------|
| POST | `/api/tickets` | Requester | Create new ticket (multipart/form-data) |
| GET | `/api/tickets` | Requester | List personal tickets (isolated per authenticated user) |
| GET | `/api/tickets/:id` | Requester | View personal ticket detail (IDOR-protected) |
| POST | `/api/tickets/:id/comments` | Authenticated | Post public comment visible to requester and IT staff |
| POST | `/api/tickets/:id/resolve` | Requester | Requester confirms issue is resolved |

---

## Running Automated Tests

```bash
# Server integration test suite (68 tests across Lab 1, 2, 3)
cd server && npm test

# Client component test suite (23 tests across Lab 1, 2, 3)
cd client && npm test
```

---

## Lab 3 — Feature Branches & Pull Requests

| PR # | Branch | Target | Description | Status |
|:---:|---|---|---|:---:|
| [#34](https://github.com/Patitta-23/LAB/pull/34) | `feature/lab3-spec` | `lab3-staging` | Spec-Driven Development documentation (6 baseline docs) | ✅ Merged |
| [#35](https://github.com/Patitta-23/LAB/pull/35) | `feature/lab3-auth` | `lab3-staging` | Authentication, express-session, bcrypt, and RBAC guards | ✅ Merged |
| [#36](https://github.com/Patitta-23/LAB/pull/36) | `feature/lab3-itstaff` | `lab3-staging` | IT Staff ticket queue, transitions (BR-10), internal notes | ✅ Merged |
| [#37](https://github.com/Patitta-23/LAB/pull/37) | `feature/lab3-admin` | `lab3-staging` | Admin user CRUD, toggle-active, reset-password | ✅ Merged |
| [#38](https://github.com/Patitta-23/LAB/pull/38) | `feature/lab3-requester` | `lab3-staging` | Requester regression, Dev Selector removal, public comments | ✅ Merged |
| [#40](https://github.com/Patitta-23/LAB/pull/40) | `feature/lab3-auth-frontend` | `lab3-staging` | Role-based UI screens, AuthContext, NavBar, 23 Vitest suite | ✅ Merged |
| [#39](https://github.com/Patitta-23/LAB/pull/39) | `lab3-staging` | `main` | Lab 3 Release Candidate (Full regression test & documentation) | ✅ Merged |

---

## Author & Peer Reviewer

- **Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)
- **Peer Reviewer:** Nannaphat Kaenphanao — 67070505219 — GitHub: [@nannaphatkn](https://github.com/nannaphatkn)