# TokTickIT

**Internal IT Service Desk Portal** — Lab 1 & Lab 2 submission for full-stack web development course.

## Overview

TokTickIT is a web application that allows employees to submit and track IT support tickets. Lab 1 built the system foundation (health check + category listing). Lab 2 adds the full **Requester-side ticketing workflow**: selecting a requester, creating tickets with file attachments, viewing a personal ticket list with search/filter/sort, and reading ticket details with soft-delete attachment management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Bootstrap 5 |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (via Docker) |
| ORM | Prisma |
| Testing | Vitest, Supertest, Testing Library |

## Project Structure

```
toktickit/
├── client/                        # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx                # App shell + routing logic
│   │   ├── api.ts                 # API fetch helpers (all endpoints)
│   │   ├── index.css              # Zen Green design system tokens
│   │   ├── components/
│   │   │   └── RequesterSelector.tsx  # Dev requester switcher
│   │   └── pages/
│   │       ├── SelectRequesterPage.tsx  # Requester selection screen
│   │       ├── TicketListPage.tsx       # My Tickets list (search/filter/sort/page)
│   │       ├── CreateTicketPage.tsx     # Create Ticket form with attachments
│   │       └── TicketDetailPage.tsx     # Ticket detail (read-only + attachments)
│   └── tests/
│       ├── lab-01/App.test.tsx
│       └── lab-02/SelectRequesterPage.test.tsx
├── server/                        # Express backend (TypeScript)
│   ├── src/
│   │   ├── app.ts                 # All API routes (Lab 1 + Lab 2)
│   │   ├── index.ts               # Server entry point
│   │   └── prisma.ts              # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema (Requester, Ticket, Attachment)
│   │   └── seed.ts                # Seeds categories + requesters
│   ├── uploads/                   # Stored attachment files
│   └── tests/
│       ├── lab-01/
│       │   ├── health.test.ts
│       │   └── categories.test.ts
│       └── lab-02/                # Lab 2 API integration tests
└── docs/
    ├── lab-01/
    │   ├── reviewer.md
    │   ├── tests.md
    │   └── ai_use.md
    └── lab-02/
        ├── specification.md       # Engineering spec + acceptance criteria
        ├── api-spec.md            # Full API specification
        ├── ui-spec.md             # Zen Green design system spec
        ├── reviewer.md            # Peer review record
        ├── tests.md               # Test plan and evidence
        └── ai-use.md              # AI usage log
```

## Prerequisites

- Node.js ≥ 18
- Docker Desktop

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

Open **http://localhost:5173** and click **Check System** to verify the connection.

## API Endpoints

### Lab 1

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", service: "TokTickIT API" }` |
| GET | `/api/categories` | Returns list of IT request categories |

### Lab 2

| Method | Path | Auth Header | Description |
|--------|------|-------------|-------------|
| GET | `/api/requesters` | — | List all ACTIVE requesters (Dev Selector) |
| POST | `/api/tickets` | `X-Requester-Id` | Create a new ticket (multipart/form-data) |
| GET | `/api/tickets` | `X-Requester-Id` | List requester's tickets (search, filter, sort, paginate) |
| GET | `/api/tickets/:id` | `X-Requester-Id` | Get ticket detail (403 if wrong owner) |
| POST | `/api/tickets/:id/attachments` | `X-Requester-Id` | Upload additional attachments |
| DELETE | `/api/attachments/:id` | `X-Requester-Id` | Soft-delete an attachment (reason required, min 10 chars) |
| GET | `/api/attachments/:id/download` | `X-Requester-Id` | Download attachment file |

## Running Tests

```bash
# Server tests (requires running PostgreSQL)
cd server && npm test

# Client tests
cd client && npm test
```

## Lab 1 — Feature Branches

| Branch | Issue | Description |
|--------|-------|-------------|
| `feature/1-project-foundation` | #1 | Project setup (React + Express + Prisma) |
| `feature/2-health-check` | #2 | `GET /api/health` endpoint |
| `feature/3-category-seed` | #3 | Category model + seed script |
| `feature/4-category-list` | #4 | `GET /api/categories` endpoint + frontend UI |

## Lab 2 — Features Implemented

### Screens

| Screen | Description |
|--------|-------------|
| **Select Requester** | Dev selector showing all ACTIVE requesters; sets session identity for all API calls |
| **My Tickets** | Personal ticket list with search, category filter, status filter, sort (createdAt/updatedAt), and pagination |
| **Create Ticket** | Form with Title, Category, Description, and file attachments (max 5 files × 5 MB, JPEG/PNG/PDF); inline validation + Confirm Remove modal |
| **Ticket Detail** | Read-only view of all ticket fields; active attachments with download links; upload more files; soft-delete attachment with reason |

### API Endpoints (Lab 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/requesters` | List ACTIVE requesters |
| `POST` | `/api/tickets` | Create ticket (multipart/form-data) |
| `GET` | `/api/tickets` | List tickets with search/filter/sort/paginate |
| `GET` | `/api/tickets/:id` | Ticket detail (IDOR-protected, 403 if wrong owner) |
| `POST` | `/api/tickets/:id/attachments` | Upload attachments |
| `DELETE` | `/api/attachments/:id` | Soft-delete attachment (reason ≥ 10 chars) |
| `GET` | `/api/attachments/:id/download` | Download attachment file |

### Business Rules

- Each ticket belongs to exactly one requester — data isolation enforced at API level (`X-Requester-Id` header)
- Accessing another requester's ticket returns `403 Forbidden` (IDOR Prevention)
- Attachments: max **5 files** per ticket, max **5 MB** each, allowed types: `image/jpeg`, `image/png`, `application/pdf`
- Attachments are **soft-deleted** (never hard-deleted) — `deletedAt` and `deleteReason` stored in DB
- Ticket status defaults to `OPEN` on creation

## Author

Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)