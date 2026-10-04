# Lab 3 — UI Specification

**Project:** TokTickIT — Authentication, IT Staff Workflow & Admin Management  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Course:** CPE 334  
**Sprint:** Lab 3  
**Created:** 2026-10-04 (before any implementation code)

---

## 1. Design System — Zen Green (Extended for Lab 3)

Lab 3 continues the **Zen Green** design system established in Lab 2, with additions for authentication screens, role-based navigation, and status/priority badges.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#2D7A5B` | Primary buttons, active nav, headings |
| `--color-primary-dark` | `#1F5C42` | Button hover, focus ring |
| `--color-primary-light` | `#E8F5EF` | Card backgrounds, info banners |
| `--color-surface` | `#FFFFFF` | Card / modal backgrounds |
| `--color-bg` | `#F4F7F5` | Page background |
| `--color-text` | `#1A2E26` | Body text |
| `--color-text-muted` | `#6B7C74` | Secondary text, placeholders |
| `--color-border` | `#D0DED8` | Input borders, dividers |
| `--color-error` | `#C0392B` | Error messages, destructive actions |
| `--color-error-light` | `#FDEDEC` | Error callout backgrounds |
| `--color-warning` | `#D4A017` | MEDIUM priority badge |
| `--color-warning-light` | `#FEF9E7` | Warning backgrounds |
| `--color-critical` | `#8E1515` | CRITICAL priority badge |

### Priority Badge Colors

| Priority | Background | Text |
|---|---|---|
| `LOW` | `#E8F5EF` | `#2D7A5B` |
| `MEDIUM` | `#FEF9E7` | `#D4A017` |
| `HIGH` | `#FDEDEC` | `#C0392B` |
| `CRITICAL` | `#8E1515` | `#FFFFFF` |

### Status Badge Colors

| Status | Background | Text |
|---|---|---|
| `OPEN` | `#EAF4FE` | `#1A6FAC` |
| `IN_PROGRESS` | `#FEF9E7` | `#D4A017` |
| `RESOLVED` | `#E8F5EF` | `#2D7A5B` |
| `CLOSED` | `#F2F2F2` | `#6B7C74` |

### Typography

```css
font-family: 'Inter', 'Outfit', sans-serif;
```

| Element | Font Size | Font Weight |
|---|---|---|
| Page Title (h1) | 1.75rem | 700 |
| Section Heading (h2) | 1.25rem | 600 |
| Body Text | 1rem | 400 |
| Small / Muted | 0.875rem | 400 |
| Badge / Pill | 0.75rem | 600 |
| Monospace (Ticket No.) | 0.875rem | 600 |

---

## 2. Layout Structure

### Navigation Bar (All Authenticated Users)

```
[ 🎫 TokTickIT ]                    [ Role Badge ]  [ Username ]  [ Logout ]
```

- **Requester** nav links: `My Tickets`, `Create Ticket`
- **IT Staff** nav links: `Ticket Queue`
- **Administrator** nav links: `User Management`
- Role badge: pill label with color — `Requester (green)`, `IT Staff (blue)`, `Admin (purple)`

### Page Layout

```
+-------- NavBar (fixed top) ---------+
|                                      |
|  +------- Page Container ----------+ |
|  |  [ Breadcrumb ]                 | |
|  |  [ Page Title ]                 | |
|  |  [ Page Content ]               | |
|  +-----------------------------------+ |
+--------------------------------------+
```

---

## 3. Screen Designs

### Screen 1: Login Screen (`/login`)

**Purpose:** Entry point for all roles. No registration; accounts created by Admin.

**Layout:**
```
+---------------------------+
|  🎫 TokTickIT             |
|  IT Service Desk Portal   |
|                           |
|  [ Email Address    ]     |
|  [ Password         🔒 ] |
|                           |
|  [ Log In          →  ]   |
|                           |
|  ⚠️ Error message area    |
+---------------------------+
```

**Elements:**
- Card centered on page, max-width 400px
- Email input (`type="email"`, id: `login-email`)
- Password input (`type="password"`, id: `login-password`) with show/hide toggle
- Submit button: "Log In" (id: `login-submit`)
- Error callout (hidden until triggered): non-specific "Invalid email or password."
- No sign-up link, no forgot password link

---

### Screen 2: Mandatory Password Change (`/change-password`)

**Purpose:** Forced screen after login when `mustChangePassword = true`.

**Layout:**
```
+--------------------------------+
|  🔒 Change Your Password       |
|  You must set a new password   |
|  before continuing.            |
|                                |
|  [ New Password          ]     |
|  [ Confirm New Password  ]     |
|                                |
|  Password must be 8+ chars,    |
|  include uppercase, lowercase, |
|  and a digit.                  |
|                                |
|  [ Set New Password → ]        |
|                                |
|  ⚠️ Error message area         |
+--------------------------------+
```

**Elements:**
- Info banner at top explaining why this screen appears
- New Password input (id: `new-password`)
- Confirm New Password input (id: `confirm-password`)
- Password strength hints visible below inputs
- Submit button: "Set New Password" (id: `change-password-submit`)
- No navigation / back button

---

### Screen 3: IT Staff Ticket Queue (`/it-staff/queue`)

**Purpose:** Full ticket queue visible to IT Staff.

**Layout:**
```
+--------------------------------------------------+
|  Ticket Queue                [🔍 Search...]      |
|  [ Category ▼ ] [ Status ▼ ] [ Priority ▼ ]      |
|  [ Assignee ▼ ] [ Sort: Last Updated ▼ ]          |
|--------------------------------------------------|
|  # | Summary | Category | Status | Priority | Assigned To | Last Updated |
|  --------------------------------------------------------------------- |
|  #TK-1001 | ... | Software | 🟡 IN_PROGRESS | 🔴 HIGH | Alice | 1hr ago |
|  #TK-1002 | ... | Hardware | 🔵 OPEN        | ⚪ LOW  | —    | 3hr ago |
|--------------------------------------------------|
|  ‹ Prev  1 … 4 5 6 … 10  Next ›                 |
+--------------------------------------------------+
```

**Elements:**
- Search input (id: `queue-search`) placeholder: "Search by ticket number or summary…"
- Filter dropdowns: Category (id: `queue-filter-category`), Status (id: `queue-filter-status`), IT Priority (id: `queue-filter-priority`), Assignee (id: `queue-filter-assignee`)
- Sort dropdown (id: `queue-sort`)
- Table with clickable rows (hover highlight)
- Priority pill badge (color-coded per Section 1)
- Status badge (color-coded per Section 1)
- Ellipsis pagination

---

### Screen 4: IT Staff Ticket Detail (`/it-staff/tickets/:id`)

**Purpose:** Full IT Staff management view of a single ticket.

**Layout — Two Column (Desktop):**
```
Left Column (70%):                    Right Column (30%):
+------------------------------+      +--------------------+
|  #TK-1001 — Ticket Title     |      | Assignee: [Select] |
|  Requester: Alice Smith      |      | IT Priority: [▼]   |
|  Category: Software          |      | Status: [▼]        |
|  Created: 2026-10-01 09:00   |      | [ Save Changes ]   |
|  Description: ...            |      +--------------------+
|                              |
|  Attachments:                |
|  📄 file.pdf  [ ⬇ Download ] |
|                              |
|  --- Public Comments ---     |
|  Alice: "My laptop won't..." |
|  IT Staff: "Please restart"  |
|  [ Add Comment ] [ Send ]    |
|                              |
|  --- Internal Notes ---      |
|  *(IT Staff only)*           |
|  IT Staff: "Needs IT Level 2"|
|  [ Add Note ] [ Send ]       |
+------------------------------+
```

**Elements:**
- Assignee dropdown: lists all active IT Staff (id: `assignee-select`)
- IT Priority dropdown (id: `priority-select`)
- Status dropdown showing only valid next statuses (id: `status-select`)
- "Claim Ticket" shortcut button (sets assignee to current IT Staff user, id: `claim-ticket-btn`)
- Public Comments thread (visible to Requester + IT Staff)
- Internal Notes thread (visible to IT Staff + Admin only — not rendered for Requester)
- Comment text area + "Send" button (id: `add-public-comment`, `send-public-comment`)
- Note text area + "Send" button (id: `add-internal-note`, `send-internal-note`)

---

### Screen 5: Administrator User Management (`/admin/users`)

**Purpose:** Full user CRUD for Administrator.

**Layout:**
```
+---------------------------------------------------+
|  User Management             [ + Create User ]    |
|  [🔍 Search name or email...] [Role ▼] [Status ▼] |
|---------------------------------------------------|
|  Name | Email | Role | Status | Last Login | Actions |
|  ---------------------------------------------------------------- |
|  Alice Smith | alice@... | Requester | ✅ Active | 1hr ago | Edit | Deactivate |
|  Bob Jones   | bob@...   | IT Staff  | ✅ Active | 3hr ago | Edit | Deactivate |
|  Carol Admin | carol@... | Admin     | ✅ Active | 1day ago| Edit | Deactivate |
|---------------------------------------------------|
|  ‹ Prev  1  2  3  Next ›                          |
+---------------------------------------------------+
```

**Modals:**

*Create / Edit User Modal:*
```
+-------------------------------+
|  Create New User              |
|                               |
|  Full Name:    [ _______ ]    |
|  Email:        [ _______ ]    |
|  Role:         [ Select ▼ ]   |
|  Password:     [ _______ ]    |
|  (will require change on login)|
|                               |
|  [ Cancel ]    [ Create User ]|
+-------------------------------+
```

*Confirm Deactivate Modal:*
```
+------------------------------------+
|  Deactivate User                   |
|  Are you sure you want to          |
|  deactivate Alice Smith?           |
|  They will no longer be able to    |
|  log in.                           |
|                                    |
|  [ Cancel ]  [ Confirm Deactivate ]|
+------------------------------------+
```

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Behaviour |
|---|---|---|
| **Desktop** | ≥ 1024px | Two-column layout for Ticket Detail; full table columns |
| **Tablet** | 768–1023px | Single column layout; some table columns hidden |
| **Mobile** | < 768px | Stacked card layout; nav collapses to hamburger menu |
