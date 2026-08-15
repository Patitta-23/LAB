# TokTickIT

**Internal IT Service Desk Portal** — Lab 1 submission for full-stack web development course.

## Overview

TokTickIT is a web application that allows employees to check the status of the IT Service Desk system and view the available IT request categories (Hardware, Software, Network, Account and Access).

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
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx          # Main UI component
│   │   └── api.ts           # API fetch logic (checkSystem)
│   └── tests/lab-01/
│       └── App.test.tsx     # Component unit tests
├── server/                  # Express backend
│   ├── src/
│   │   ├── app.ts           # Express routes
│   │   ├── index.ts         # Server entry point
│   │   └── prisma.ts        # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma    # DB schema (Category model)
│   │   └── seed.ts          # Seeds 4 categories
│   └── tests/lab-01/
│       ├── health.test.ts   # GET /api/health integration test
│       └── categories.test.ts # GET /api/categories integration test
└── docs/lab-01/
    ├── reviewer.md          # Peer review record
    ├── tests.md             # Test plan and evidence
    └── ai_use.md            # AI usage log
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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", service: "TokTickIT API" }` |
| GET | `/api/categories` | Returns list of 4 IT request categories |

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

## Author

Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)