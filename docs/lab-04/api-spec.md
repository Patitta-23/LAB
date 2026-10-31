# Lab 4 — API Specification

**Project:** TokTickIT — Ticket Detail & Action System  
**Author:** Patitta Daensikaew — 67070505221  
**Sprint:** Lab 4  
**Base URL:** `/api`  
**Auth:** All endpoints require a valid session cookie (`connect.sid`). Unauthorized → `401`. Wrong role → `403`.

---

## Authentication Model (Inherited from Lab 3)

All requests must include the session cookie set by `POST /api/auth/login`.  
Role is derived from `req.session.user.role` on the server.

---

## Ticket Action Endpoints

### `GET /api/tickets/:id`
Retrieve full ticket detail including comments and attachments.

**Authorization:**
- `Requester`: only if `ticket.requesterId === session.userId`
- `IT_Staff`, `Administrator`: any ticket

**Response `200`:**
```json
{
  "id": "string",
  "ticketNo": "TK-001",
  "title": "string",
  "description": "string",
  "category": "string",
  "status": "OPEN | IN_PROGRESS | PENDING | RESOLVED | CLOSED",
  "itPriority": "LOW | MEDIUM | HIGH | CRITICAL | null",
  "assigneeId": "string | null",
  "assignee": { "id": "string", "name": "string" } | null,
  "requesterId": "string",
  "requester": { "id": "string", "name": "string" },
  "attachments": [
    { "id": "string", "filename": "string", "url": "string", "size": 0 }
  ],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Errors:** `401`, `403`, `404`

---

### `PATCH /api/tickets/:id/claim`
Claim or reassign a ticket to an IT Staff member.

**Authorization:** `IT_Staff` only

**Request Body:**
```json
{
  "assigneeId": "string"  // IT Staff user ID; use session.userId to claim self
}
```

**Side Effect:** If `ticket.status === 'OPEN'`, automatically set status → `IN_PROGRESS`.

**Response `200`:**
```json
{
  "id": "string",
  "assigneeId": "string",
  "assignee": { "id": "string", "name": "string" },
  "status": "string"
}
```

**Errors:** `400` (assigneeId not IT_Staff), `401`, `403`, `404`, `422` (missing assigneeId)

---

### `PATCH /api/tickets/:id/status`
Change the ticket status (IT Staff only; enforces state machine).

**Authorization:** `IT_Staff` only

**Request Body:**
```json
{
  "status": "IN_PROGRESS | PENDING | RESOLVED | CLOSED"
}
```

**Validation:** Server checks permitted transitions per Business Rule BR-05.

**Response `200`:**
```json
{
  "id": "string",
  "status": "string",
  "updatedAt": "ISO8601"
}
```

**Errors:** `400` (invalid transition), `401`, `403`, `404`, `422` (missing/invalid status)

---

### `PATCH /api/tickets/:id/priority`
Change the IT Priority of a ticket.

**Authorization:** `IT_Staff`, `Administrator`

**Request Body:**
```json
{
  "itPriority": "LOW | MEDIUM | HIGH | CRITICAL"
}
```

**Response `200`:**
```json
{
  "id": "string",
  "itPriority": "string",
  "updatedAt": "ISO8601"
}
```

**Errors:** `400` (invalid value), `401`, `403`, `404`, `422`

---

### `PATCH /api/tickets/:id/resolve`
Requester marks their ticket as resolved ("Problem Appears Resolved").

**Authorization:** `Requester` — only if `ticket.requesterId === session.userId`

**Request Body:** _(none)_

**Side Effect:** Sets `status → RESOLVED`.

**Response `200`:**
```json
{
  "id": "string",
  "status": "RESOLVED",
  "updatedAt": "ISO8601"
}
```

**Errors:** `400` (ticket not in resolvable state), `401`, `403`, `404`

---

## Comment Endpoints

### `GET /api/tickets/:id/comments`
Get all comments for a ticket.

**Authorization:**
- `Requester`: only own ticket; response filters out `type: "INTERNAL"` comments
- `IT_Staff`, `Administrator`: all tickets; all comment types returned

**Response `200`:**
```json
[
  {
    "id": "string",
    "type": "PUBLIC | INTERNAL",
    "content": "string",
    "author": { "id": "string", "name": "string", "role": "string" },
    "createdAt": "ISO8601"
  }
]
```

**Errors:** `401`, `403`, `404`

---

### `POST /api/tickets/:id/comments`
Add a comment or internal note to a ticket.

**Authorization:**
- `Requester`: only own ticket; `type` is forced to `PUBLIC` (cannot set `INTERNAL`)
- `IT_Staff`, `Administrator`: any ticket; can set `type: "INTERNAL"`

**Request Body:**
```json
{
  "content": "string (required, min 1 char)",
  "type": "PUBLIC | INTERNAL"  // Requester: ignored/forced PUBLIC
}
```

**Response `201`:**
```json
{
  "id": "string",
  "type": "PUBLIC | INTERNAL",
  "content": "string",
  "author": { "id": "string", "name": "string", "role": "string" },
  "createdAt": "ISO8601"
}
```

**Errors:** `401`, `403` (Requester trying INTERNAL → 403), `404`, `422` (empty content)

---

## IT Staff List (for Reassign Dropdown)

### `GET /api/users/it-staff`
Get list of active IT Staff members (for Reassign dropdown).

**Authorization:** `IT_Staff`, `Administrator`

**Response `200`:**
```json
[
  { "id": "string", "name": "string", "email": "string" }
]
```

**Errors:** `401`, `403`

---

## Error Response Format

All errors return structured JSON:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

| HTTP | code | When |
|------|------|------|
| 400 | `INVALID_TRANSITION` | Status transition not permitted |
| 400 | `INVALID_ASSIGNEE` | assigneeId is not an IT Staff member |
| 400 | `NOT_RESOLVABLE` | Ticket not in a resolvable state |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Role not permitted for this action |
| 404 | `NOT_FOUND` | Ticket or comment not found |
| 422 | `VALIDATION_ERROR` | Missing / malformed request body |

---

## RBAC Evidence Summary

| Endpoint | Requester | IT Staff | Admin |
|----------|-----------|----------|-------|
| `PATCH .../claim` | 403 | 200 | 403 |
| `PATCH .../status` | 403 | 200 | 403 |
| `PATCH .../priority` | 403 | 200 | 200 |
| `PATCH .../resolve` | 200 (own) | 403 | 403 |
| `POST .../comments` (INTERNAL) | 403 | 201 | 201 |
| `GET /api/users/it-staff` | 403 | 200 | 200 |
