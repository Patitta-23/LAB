# Lab 4 — UI Specification

**Project:** TokTickIT — Ticket Detail & Action System  
**Author:** Patitta Daensikaew — 67070505221  
**Sprint:** Lab 4

---

## Design Tokens (inherited from Lab 3)

| Token | Value |
|-------|-------|
| Primary | `#2563EB` (blue-600) |
| Danger | `#DC2626` (red-600) |
| Warning | `#D97706` (amber-600) |
| Success | `#16A34A` (green-600) |
| Neutral | `#6B7280` (gray-500) |
| Surface | `#FFFFFF` |
| Background | `#F9FAFB` (gray-50) |
| Border | `#E5E7EB` (gray-200) |
| Font | Inter, system-ui |
| Zen Green accent | `#4ADE80` (green-400) |

---

## Pages & Components

---

### 1. IT Staff — Ticket Detail Page (`/it/tickets/:id`)

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  NavBar (inherited)                                     │
├─────────────────────────────────────────────────────────┤
│  ← Back to Queue          TK-042                        │
│                                                         │
│  [Title]                              [Status Badge]    │
│  [Category]                      [IT Priority Badge]    │
│                                                         │
│  ┌──────────────────────────┬──────────────────────┐   │
│  │ Description              │ Ticket Info          │   │
│  │ (read-only)              │ Assignee: [name]     │   │
│  │                          │ Created by: [name]   │   │
│  │                          │ Created: [date]      │   │
│  │                          │ Updated: [date]      │   │
│  └──────────────────────────┴──────────────────────┘   │
│                                                         │
│  ── Actions ────────────────────────────────────────── │
│  [Claim / Reassign Control]   [Priority ▼]  [Status ▼] │
│                                                         │
│  ── Attachments ───────────────────────────────────── │
│  📎 filename.pdf   [Download]                           │
│                                                         │
│  ── Comments & Notes ──────────────────────────────── │
│  [Comment List]                                         │
│  [Comment Form]                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Requester — Ticket Detail Page (`/tickets/:id`)

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  NavBar (inherited)                                     │
├─────────────────────────────────────────────────────────┤
│  ← My Tickets             TK-042                        │
│                                                         │
│  [Title]                              [Status Badge]    │
│  [Category]                                             │
│                                                         │
│  Description: [text]                                    │
│  Created: [date]   Updated: [date]                      │
│                                                         │
│  ── Attachments ───────────────────────────────────── │
│  📎 filename.pdf   [Download]                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✅ Problem Appears Resolved  [Button]            │   │  ← shown only when status ∈ {IN_PROGRESS, PENDING, RESOLVED}
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ── Comments ──────────────────────────────────────── │
│  [Public Comment List]                                  │
│  [Comment Form — Public only]                           │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Component: `ClaimReassignControl`

**States:**
- **Unassigned**: Shows `[Claim]` button (primary style).
- **Assigned to self**: Shows `Assigned to: You` + `[Reassign ▼]` dropdown.
- **Assigned to other**: Shows `Assigned to: [Name]` + `[Reassign ▼]` dropdown.

**Reassign Dropdown:** Lists all active IT Staff members from `GET /api/users/it-staff`.

**Behavior:**
- Claim → `PATCH /api/tickets/:id/claim` with `{ assigneeId: session.userId }`.
- Reassign → same endpoint with selected `assigneeId`.
- On success: refresh ticket data, show success toast.
- On error: show inline error message.

---

### 4. Component: `PriorityDropdown`

**Values:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`  
**Styling:**

| Value | Badge Color |
|-------|-------------|
| LOW | `gray` |
| MEDIUM | `blue` |
| HIGH | `amber` |
| CRITICAL | `red` |

**Behavior:**
- `PATCH /api/tickets/:id/priority` on change.
- Optimistic update + revert on error.
- Disabled for Requester (hidden entirely).

---

### 5. Component: `StatusDropdown`

**Permitted options** computed from current status (state machine):
- `OPEN` → shows `[IN_PROGRESS]`
- `IN_PROGRESS` → shows `[PENDING, RESOLVED, CLOSED]`
- `PENDING` → shows `[IN_PROGRESS, RESOLVED]`
- `RESOLVED` → shows `[CLOSED]`
- `CLOSED` → disabled (no transitions)

**Styling:** Same badge colors as Lab 3.  
**Behavior:** `PATCH /api/tickets/:id/status` on selection.

---

### 6. Component: `CommentSection`

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  Comments & Notes                                       │
├─────────────────────────────────────────────────────────┤
│  [Avatar] Alice (Requester)  · 2 hours ago              │
│  This printer has been broken since Monday.             │
│                                                         │
│  [Avatar] Eve (IT Staff)  🔒 Internal Note  · 1 hour ago│
│  Check toner cartridge first.                           │
│  ─────────────────────────────────────────────────── │
│  Add a Comment:                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Textarea]                                       │  │
│  └──────────────────────────────────────────────────┘  │
│  [● Public Comment  ○ Internal Note]  ← IT Staff only   │
│                                      [Submit]           │
└─────────────────────────────────────────────────────────┘
```

**Rules:**
- Requester: sees only Public comments; toggle hidden; type forced to `PUBLIC`.
- IT Staff/Admin: sees all comments; Internal Notes marked with 🔒 badge.
- Empty content → submit button disabled.

---

### 7. Component: `ProblemAppearsResolvedButton`

**Visibility:** Only for Requester + ticket owner + status ∈ `{IN_PROGRESS, PENDING, RESOLVED}`.

**Appearance:**
```
┌───────────────────────────────────────┐
│  ✅  Problem Appears Resolved          │
└───────────────────────────────────────┘
```
- Color: `green-600` border + text.
- Disabled + hidden when `status === CLOSED`.

**Confirmation Dialog:**
```
"Are you sure the problem has been resolved?
 This will mark the ticket as Resolved."
[Cancel]  [Confirm]
```

**Behavior:** `PATCH /api/tickets/:id/resolve` → refresh status → hide button.

---

### 8. Toast / Feedback

| Event | Message |
|-------|---------|
| Claim success | "Ticket claimed successfully." |
| Reassign success | "Ticket reassigned to [Name]." |
| Status changed | "Status updated to [STATUS]." |
| Priority changed | "IT Priority set to [PRIORITY]." |
| Comment submitted | "Comment posted." |
| Resolved | "Ticket marked as Resolved." |
| Error (403) | "You do not have permission to perform this action." |
| Error (400) | Server error message displayed inline. |

---

## Routing (additions to Lab 3)

| Path | Component | Guard |
|------|-----------|-------|
| `/tickets/:id` | `RequesterTicketDetail` | `requireAuth` + Requester role (own ticket) |
| `/it/tickets/:id` | `ItStaffTicketDetail` | `requireAuth` + IT_Staff or Administrator |
