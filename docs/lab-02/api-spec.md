# Lab 2 — API Specification

**Project:** TokTickIT — Lab 2  
**Author:** Patitta Daensikaew  
**Base URL:** `http://localhost:3000/api`

---

## 1. Dev Requester Context

### GET /requesters
Returns all ACTIVE Requesters for the Dev Selector.

**Response 200**
```json
[
  { "id": 1, "name": "Alice Requester", "email": "alice@company.com", "status": "ACTIVE" },
  { "id": 2, "name": "Bob Requester",   "email": "bob@company.com",   "status": "ACTIVE" }
]
```

---

## 2. Tickets

### POST /tickets
Create a new Ticket. The requesting Requester ID is passed in the header `X-Requester-Id`.

**Request Headers**
```
X-Requester-Id: 1
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data)**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | Yes | 1–200 chars |
| `categoryId` | number | Yes | Must be valid category ID |
| `description` | string | Yes | 1–2000 chars |
| `attachments` | file[] | No | Max 5 files, each <= 5MB, MIME: jpeg/png/webp/pdf |

**Response 201**
```json
{
  "id": 42,
  "title": "Cannot login to VPN",
  "description": "Getting error code 800...",
  "status": "OPEN",
  "categoryId": 4,
  "requesterId": 1,
  "createdAt": "2026-09-03T05:00:00.000Z",
  "updatedAt": "2026-09-03T05:00:00.000Z"
}
```

**Response 400** — Validation error
```json
{ "error": "Validation failed", "details": ["Title is required", "Category is invalid"] }
```

**Response 422** — Attachment rule violation
```json
{ "error": "Attachment limit exceeded", "details": "Maximum 5 attachments per ticket" }
```

---

### GET /tickets
List Tickets for the authenticated Requester (filtered by `X-Requester-Id`).

**Request Headers**
```
X-Requester-Id: 1
```

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Full-text search on title and description |
| `status` | string | — | Filter: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `categoryId` | number | — | Filter by category |
| `sortBy` | string | `createdAt` | `createdAt` or `updatedAt` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `page` | number | `1` | Page number (1-indexed) |
| `limit` | number | `10` | Items per page |

**Response 200**
```json
{
  "data": [
    {
      "id": 42,
      "title": "Cannot login to VPN",
      "status": "OPEN",
      "category": { "id": 4, "name": "Network" },
      "createdAt": "2026-09-03T05:00:00.000Z",
      "updatedAt": "2026-09-03T05:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### GET /tickets/:id
Get a single Ticket detail (must belong to the requesting Requester).

**Request Headers**
```
X-Requester-Id: 1
```

**Response 200**
```json
{
  "id": 42,
  "title": "Cannot login to VPN",
  "description": "Getting error code 800...",
  "status": "OPEN",
  "category": { "id": 4, "name": "Network" },
  "requesterId": 1,
  "createdAt": "2026-09-03T05:00:00.000Z",
  "updatedAt": "2026-09-03T05:00:00.000Z",
  "attachments": [
    {
      "id": 5,
      "filename": "screenshot.png",
      "mimeType": "image/png",
      "sizeBytes": 204800,
      "url": "/api/attachments/5/download",
      "createdAt": "2026-09-03T05:00:00.000Z"
    }
  ]
}
```

**Response 403** — Ticket does not belong to the Requester
```json
{ "error": "Forbidden" }
```

**Response 404** — Ticket not found
```json
{ "error": "Ticket not found" }
```

---

## 3. Attachments

### POST /tickets/:id/attachments
Upload additional attachments to an existing Ticket.

**Request Headers**
```
X-Requester-Id: 1
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data)**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `attachments` | file[] | Yes | Total per ticket <= 5, each <= 5MB, allowed MIME |

**Response 201**
```json
[
  {
    "id": 6,
    "filename": "log.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 102400,
    "url": "/api/attachments/6/download",
    "createdAt": "2026-09-03T05:10:00.000Z"
  }
]
```

**Response 422** — Would exceed 5 attachment limit
```json
{ "error": "Attachment limit exceeded", "details": "This ticket already has 4 attachments. You can add at most 1 more." }
```

---

### DELETE /attachments/:id
Soft-delete an Attachment (requires a reason).

**Request Headers**
```
X-Requester-Id: 1
Content-Type: application/json
```

**Request Body**
```json
{ "reason": "Uploaded wrong file accidentally" }
```

**Validation:** `reason` must be a string with at least 10 characters.

**Response 200**
```json
{ "message": "Attachment removed", "attachmentId": 5 }
```

**Response 400** — Reason too short
```json
{ "error": "Reason must be at least 10 characters" }
```

**Response 403** — Attachment belongs to a different Requester's Ticket
```json
{ "error": "Forbidden" }
```

---

### GET /attachments/:id/download
Download an Attachment file.

**Request Headers**
```
X-Requester-Id: 1
```

**Response 200** — Binary file stream with appropriate `Content-Type` and `Content-Disposition: attachment; filename="..."` headers.

**Response 404** — Attachment not found or soft-deleted
```json
{ "error": "Attachment not found" }
```

---

## 4. Error Response Format

All errors follow this shape:
```json
{
  "error": "Human-readable error message",
  "details": "Optional additional detail or array of strings"
}
```

## 5. HTTP Status Code Reference

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (wrong owner) |
| 404 | Not Found |
| 422 | Unprocessable Entity (business rule violation) |
| 500 | Internal Server Error |
