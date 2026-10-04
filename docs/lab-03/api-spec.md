# Lab 3 — API Specification

**Project:** TokTickIT — Authentication, IT Staff Workflow & Admin Management  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334  
**Sprint:** Lab 3  
**Created:** 2026-10-04 (before any implementation code)

---

## Base URL

```
http://localhost:3000/api
```

All Lab 3 endpoints require an active session cookie (`connect.sid`) unless marked as **Public**.

---

## Authentication Middleware

| Middleware | Applied To | Behaviour |
|---|---|---|
| `requireAuth` | All protected routes | Returns `401 Unauthorized` if no active session |
| `requireRole(...roles)` | Role-specific routes | Returns `403 Forbidden` if user's role not in allowed list |

---

## 1. Authentication Endpoints

### POST `/api/auth/login`
**Access:** Public  
**Description:** Authenticate user and create session.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "Password1"
}
```

**Response 200 OK:**
```json
{
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "Requester",
    "mustChangePassword": false
  }
}
```

**Response 401 Unauthorized:**
```json
{ "error": "Invalid email or password." }
```

**Response 403 Forbidden (account disabled):**
```json
{ "error": "Your account has been deactivated. Please contact your administrator." }
```

---

### POST `/api/auth/logout`
**Access:** Authenticated  
**Description:** Destroy session and clear cookie.

**Response 200 OK:**
```json
{ "message": "Logged out successfully." }
```

---

### GET `/api/auth/me`
**Access:** Authenticated  
**Description:** Return the currently authenticated user's identity.

**Response 200 OK:**
```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "role": "Requester",
  "mustChangePassword": false
}
```

**Response 401 Unauthorized:**
```json
{ "error": "Unauthenticated." }
```

---

### POST `/api/auth/change-password`
**Access:** Authenticated  
**Description:** Change password. Clears `mustChangePassword` flag on success.

**Request Body:**
```json
{
  "newPassword": "NewPass1",
  "confirmPassword": "NewPass1"
}
```

**Response 200 OK:**
```json
{ "message": "Password changed successfully." }
```

**Response 400 Bad Request (validation failure):**
```json
{ "error": "Password must be at least 8 characters with uppercase, lowercase, and a digit." }
```

---

## 2. IT Staff Ticket Queue Endpoints

### GET `/api/it-staff/tickets`
**Access:** `IT_Staff`, `Administrator`  
**Description:** Paginated list of all Tickets with optional search, filter, and sort.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Full-text search on title/description |
| `status` | string | — | Filter by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) |
| `category` | number | — | Filter by category ID |
| `priority` | string | — | Filter by IT priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `assigneeId` | number | — | Filter by assigned IT Staff user ID |
| `sort` | string | `createdAt` | Sort field (`createdAt`, `updatedAt`, `priority`) |
| `order` | string | `desc` | Sort order (`asc`, `desc`) |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |

**Response 200 OK:**
```json
{
  "tickets": [
    {
      "id": 1,
      "ticketNumber": "TK-1001",
      "title": "Laptop won't start",
      "category": { "id": 1, "name": "Hardware" },
      "status": "OPEN",
      "itPriority": "HIGH",
      "assignedStaff": null,
      "requester": { "id": 2, "name": "Alice Smith" },
      "createdAt": "2026-10-01T09:00:00Z",
      "updatedAt": "2026-10-01T09:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

---

### GET `/api/it-staff/tickets/:id`
**Access:** `IT_Staff`, `Administrator`  
**Description:** Full ticket detail for IT Staff view (includes Internal Notes).

**Response 200 OK:**
```json
{
  "id": 1,
  "ticketNumber": "TK-1001",
  "title": "Laptop won't start",
  "description": "My laptop shows a black screen...",
  "category": { "id": 1, "name": "Hardware" },
  "status": "OPEN",
  "itPriority": "HIGH",
  "assignedStaff": null,
  "requester": { "id": 2, "name": "Alice Smith" },
  "attachments": [
    {
      "id": 1,
      "filename": "photo.jpg",
      "fileSize": 204800,
      "mimeType": "image/jpeg",
      "downloadUrl": "/api/attachments/1/download",
      "isActive": true
    }
  ],
  "publicComments": [
    {
      "id": 1,
      "author": { "id": 2, "name": "Alice Smith", "role": "Requester" },
      "content": "My laptop shows a black screen.",
      "createdAt": "2026-10-01T09:30:00Z"
    }
  ],
  "internalNotes": [
    {
      "id": 1,
      "author": { "id": 3, "name": "Bob Jones", "role": "IT_Staff" },
      "content": "Needs Level 2 escalation.",
      "createdAt": "2026-10-01T10:00:00Z"
    }
  ],
  "createdAt": "2026-10-01T09:00:00Z",
  "updatedAt": "2026-10-01T10:00:00Z"
}
```

---

### PATCH `/api/it-staff/tickets/:id`
**Access:** `IT_Staff`, `Administrator`  
**Description:** Update assignee, IT priority, and/or status (with transition validation).

**Request Body (all fields optional):**
```json
{
  "assignedStaffId": 3,
  "itPriority": "HIGH",
  "status": "IN_PROGRESS"
}
```

**Response 200 OK:**
```json
{ "message": "Ticket updated successfully.", "ticket": { "..." } }
```

**Response 400 Bad Request (invalid status transition):**
```json
{ "error": "Invalid status transition from OPEN to RESOLVED." }
```

---

### POST `/api/it-staff/tickets/:id/claim`
**Access:** `IT_Staff`  
**Description:** Assign ticket to the currently logged-in IT Staff member.

**Response 200 OK:**
```json
{ "message": "Ticket claimed successfully.", "assignedStaff": { "id": 3, "name": "Bob Jones" } }
```

---

## 3. Comments & Notes Endpoints

### GET `/api/tickets/:id/comments`
**Access:** `Requester` (own tickets only), `IT_Staff`, `Administrator`  
**Description:** Get all public comments for a ticket.

**Response 200 OK:**
```json
{
  "comments": [
    {
      "id": 1,
      "author": { "id": 2, "name": "Alice Smith", "role": "Requester" },
      "content": "Is there any update?",
      "createdAt": "2026-10-01T11:00:00Z"
    }
  ]
}
```

---

### POST `/api/tickets/:id/comments`
**Access:** `Requester` (own tickets only), `IT_Staff`, `Administrator`  
**Description:** Add a public comment.

**Request Body:**
```json
{ "content": "Is there any update on my ticket?" }
```

**Response 201 Created:**
```json
{
  "comment": {
    "id": 2,
    "author": { "id": 2, "name": "Alice Smith" },
    "content": "Is there any update on my ticket?",
    "createdAt": "2026-10-01T11:05:00Z"
  }
}
```

---

### POST `/api/it-staff/tickets/:id/notes`
**Access:** `IT_Staff`, `Administrator`  
**Description:** Add an internal note (not visible to Requester).

**Request Body:**
```json
{ "content": "Escalating to Level 2 team." }
```

**Response 201 Created:**
```json
{
  "note": {
    "id": 1,
    "author": { "id": 3, "name": "Bob Jones" },
    "content": "Escalating to Level 2 team.",
    "createdAt": "2026-10-01T11:10:00Z"
  }
}
```

---

### POST `/api/tickets/:id/resolve`
**Access:** `Requester` (own tickets only)  
**Description:** Requester marks ticket as Resolved ("Problem Appears Resolved").

**Response 200 OK:**
```json
{ "message": "Ticket marked as resolved.", "status": "RESOLVED" }
```

---

## 4. Administrator User Management Endpoints

### GET `/api/admin/users`
**Access:** `Administrator`  
**Description:** Paginated list of all users.

**Query Parameters:** `search`, `role`, `status` (`active` | `inactive`), `page`, `limit`

**Response 200 OK:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "Requester",
      "isActive": true,
      "mustChangePassword": false,
      "lastLoginAt": "2026-10-04T01:00:00Z"
    }
  ],
  "total": 8,
  "page": 1,
  "totalPages": 1
}
```

---

### POST `/api/admin/users`
**Access:** `Administrator`  
**Description:** Create a new user. Sets `mustChangePassword = true` automatically.

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "role": "IT_Staff",
  "password": "TempPass1"
}
```

**Response 201 Created:**
```json
{ "user": { "id": 9, "name": "New User", "email": "newuser@example.com", "role": "IT_Staff", "isActive": true, "mustChangePassword": true } }
```

---

### PATCH `/api/admin/users/:id`
**Access:** `Administrator`  
**Description:** Update user name, email, or role.

**Request Body (fields optional):**
```json
{ "name": "Updated Name", "email": "updated@example.com", "role": "Requester" }
```

**Response 200 OK:**
```json
{ "message": "User updated successfully.", "user": { "..." } }
```

---

### PATCH `/api/admin/users/:id/toggle-active`
**Access:** `Administrator`  
**Description:** Toggle user `isActive` between true and false.

**Response 200 OK:**
```json
{ "message": "User deactivated successfully.", "isActive": false }
```

---

### POST `/api/admin/users/:id/reset-password`
**Access:** `Administrator`  
**Description:** Set a new temporary password for a user and set `mustChangePassword = true`.

**Request Body:**
```json
{ "newPassword": "TempPass99" }
```

**Response 200 OK:**
```json
{ "message": "Password reset successfully. User will be required to change it on next login." }
```

---

## 5. Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message.",
  "details": ["Optional field-level validation error messages"]
}
```

| HTTP Status | Meaning |
|---|---|
| `400 Bad Request` | Validation failure or invalid input |
| `401 Unauthorized` | No active session |
| `403 Forbidden` | Authenticated but insufficient role |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate email on user creation |
| `500 Internal Server Error` | Unexpected server-side error |
