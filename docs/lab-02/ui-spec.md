# Lab 2 — UI Specification: Zen Green Design System

**Project:** TokTickIT — Lab 2  
**Author:** Patitta Daensikaew  

---

## 1. Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#2D6A4F` | Primary buttons, active nav, links |
| `--color-primary-hover` | `#1B4332` | Button hover state |
| `--color-primary-light` | `#52B788` | Badges, highlights, success indicators |
| `--color-primary-pale` | `#D8F3DC` | Backgrounds, selected state |
| `--color-accent` | `#40916C` | Secondary actions, borders |
| `--color-surface` | `#F8FAF9` | Page background |
| `--color-surface-card` | `#FFFFFF` | Card / panel background |
| `--color-text-primary` | `#1B2D25` | Main body text |
| `--color-text-secondary` | `#4A6358` | Labels, captions, placeholders |
| `--color-text-disabled` | `#9DB5AA` | Disabled text |
| `--color-border` | `#C8DDD5` | Input borders, dividers |
| `--color-error` | `#B5231A` | Validation errors, destructive actions |
| `--color-error-pale` | `#FDECEA` | Error message backgrounds |
| `--color-warning` | `#B45309` | Warning badges |
| `--color-warning-pale` | `#FEF3C7` | Warning message backgrounds |

---

## 2. Status Badge Colors

| Status | Background | Text |
|--------|------------|------|
| `OPEN` | `#D8F3DC` | `#1B4332` |
| `IN_PROGRESS` | `#FEF3C7` | `#92400E` |
| `RESOLVED` | `#DBEAFE` | `#1E40AF` |
| `CLOSED` | `#F3F4F6` | `#6B7280` |

---

## 3. Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Body | Inter (Google Fonts) | 14px | 400 |
| Label | Inter | 13px | 500 |
| Heading H1 | Inter | 28px | 700 |
| Heading H2 | Inter | 22px | 600 |
| Heading H3 | Inter | 18px | 600 |
| Button | Inter | 14px | 600 |
| Caption | Inter | 12px | 400 |

---

## 4. Spacing Scale

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
```

---

## 5. Border Radius

```
--radius-sm: 4px     (inputs, tags)
--radius-md: 8px     (cards, buttons)
--radius-lg: 12px    (modals, panels)
--radius-full: 9999px (pills, badges)
```

---

## 6. Shadows

```
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08)
--shadow-md: 0 4px 12px rgba(0,0,0,0.10)
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12)
```

---

## 7. Responsive Breakpoints

| Name | Min Width | Layout |
|------|-----------|--------|
| Mobile | < 768px | Single column, stacked nav |
| Tablet | 768px – 1023px | 2-column grid where applicable |
| Desktop | >= 1024px | Full sidebar + main content layout |

---

## 8. Component Specifications

### 8.1 Dev Requester Selector (Header Bar)
- Positioned in the top navigation bar (right side).
- Displays selected Requester's name and avatar initials.
- Dropdown lists all ACTIVE Requesters.
- Selected state uses `--color-primary-pale` background.

### 8.2 Create Ticket Form
- Card layout with `--shadow-md`, `--radius-lg`.
- Each field: label (13px, medium), input with `--color-border` border, focus ring `--color-primary`.
- Error state: border `--color-error`, error text below field in `--color-error`.
- Submit button: `--color-primary` background, white text, hover `--color-primary-hover`.
- File upload zone: dashed border `--color-border`, hover background `--color-primary-pale`.

### 8.3 My Tickets List
- Table or card grid layout.
- Status badge: pill shape (`--radius-full`), colors per Section 2.
- Pagination: previous/next buttons + page number chips.
- Search bar: full-width on mobile, 320px fixed on desktop.
- Empty state: centered illustration + "No tickets found" text.

### 8.4 Ticket Detail
- Two-column layout on desktop: left (details, 60%), right (attachments, 40%).
- Single column on mobile.
- Attachment card: icon by file type, filename, size, Download button (outlined), Remove button (text `--color-error`).
- Remove confirmation modal: overlay `rgba(0,0,0,0.4)`, card `--radius-lg`, reason textarea required.

---

## 9. UI State Checklist

For each interactive screen, the following states must be visually handled:

- [ ] **Loading** — skeleton or spinner while fetching data
- [ ] **Empty** — empty state illustration and call-to-action
- [ ] **Populated** — normal data display
- [ ] **Error** — error banner or inline message
- [ ] **Form validation** — inline field-level errors
- [ ] **Disabled** — buttons disabled during async operations
