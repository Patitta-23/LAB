# Lab 2 — Peer Review Record

**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Peer Reviewer:** Nannaphat Kaenphanao — 67070505219 — GitHub: [@nannaphatkn](https://github.com/nannaphatkn)  
**Repository:** [Patitta-23/LAB-01](https://github.com/Patitta-23/LAB-01)  
**Sprint:** Lab 2 — IT Service Desk Portal (Requester Side)

---

## Overview & Review Workflow

In accordance with Lab 2 Specification and Definition of Done (DoD), all feature branches were developed in isolation, peer-reviewed via GitHub Pull Requests, and merged into `lab2-staging` before final consolidation into `main`.

---

## 1. Pull Requests I Authored (Reviewed by Partner `@nannaphatkn`)

| PR Link | Branch | Description & Scope | Reviewer Verdict | Detailed Comments Received | Author Response & Action Taken | Status |
|---|---|---|---|---|---|---|
| [#19](https://github.com/Patitta-23/LAB-01/pull/19) | `feature/lab2-feature-d` | **Dev Requester Context & Identity Management**<br>• Section 8.1 Requester selection screen<br>• `X-Requester-Id` header context<br>• IDOR backend data isolation checks | `Approved` | **@nannaphatkn:** "Approved! The requester identity context is handled cleanly via React Context & localStorage header (`X-Requester-Id`). Verified that switching requesters instantly isolates ticket data without leaking. Code structure and unit tests are clean." | Thank you! Confirmed IDOR isolation across all API endpoints with vitest integration tests. Merged to `lab2-staging`. | Merged |
| [#20](https://github.com/Patitta-23/LAB-01/pull/20) | `feature/lab2-feature-e` | **Create Ticket Screen & File Upload Validation**<br>• Client/Server validation for title, category, description<br>• Max 5 files, <= 5MB limit, MIME type checks<br>• Data preserved on API failure | `Approved` | **@nannaphatkn:** "Approved! Client-side validation correctly intercepts invalid files (>5MB, non-supported MIME types) before sending network requests. File count counter correctly updates from `0 / 5 files` to `5 / 5 files`. Form data is preserved on server failure as requested." | Appreciated! Added confirm remove popup modal for uploaded attachments and client unit tests. Merged to `lab2-staging`. | Merged |
| [#21](https://github.com/Patitta-23/LAB-01/pull/21) | `feature/lab2-feature-f` | **My Tickets Screen, Search, Filter & Pagination**<br>• Table columns: Ticket No., Summary, Category, Status, Created Date, Last Updated<br>• Full-text search & category/status dropdown filters<br>• Ellipsis pagination | `Approved` | **@nannaphatkn:** "Approved! Table UI looks great with Zen Green design system. Search by ticket number/summary works smoothly, and category/status filter dropdowns work as expected. Ellipsis pagination handles large page numbers cleanly." | Thanks for reviewing! Added clear filter button when filters are active and formatted created date with exact timestamp. Merged to `lab2-staging`. | Merged |
| [#22](https://github.com/Patitta-23/LAB-01/pull/22) | `feature/lab2-feature-g` | **Ticket Detail View & Soft-Delete Attachments**<br>• Read-only view of ticket details<br>• Download button for active attachments<br>• Soft-delete modal with mandatory 10-char reason validation | `Approved` | **@nannaphatkn:** "Approved! Soft-delete with minimum 10-character reason validation is functioning properly. The popup modal confirms removal safely, and deleted attachments are hidden from active list while preserved in DB with `deletedAt` timestamp." | Thanks for testing edge cases! Added explicit removal confirmation modal popup and tests. Merged to `lab2-staging`. | Merged |
| [#23](https://github.com/Patitta-23/LAB-01/pull/23) | `feature/lab2-frontend` | **Zen Green UI Design System & Vite Proxy**<br>• Complete CSS design tokens (`--color-primary`, `--color-surface`)<br>• Vite proxy `/api` configuration<br>• Responsive mobile/tablet/desktop layouts | `Approved` | **@nannaphatkn:** "Approved! Zen Green color palette tokens applied consistently across all pages. Vite API proxy resolves CORS issues cleanly in development mode. Layout responsiveness verified." | Thank you! Verified across all breakpoints and ran full Vitest suite (36 server + 11 client tests passed). Merged to `lab2-staging`. | Merged |
| [#24](https://github.com/Patitta-23/LAB-01/pull/24) | `lab2-staging` | **Lab 2 Staging Release Candidate**<br>• Final consolidation of all feature branches<br>• Full automated & manual regression test suite<br>• Submission documentation update | `Approved` | **@nannaphatkn:** "Approved! All Lab 2 Acceptance Criteria (AC-01 to AC-05) and Definition of Done (DoD) requirements are met. 100% test pass rate. Final release ready for deployment to `main`." | Merged `lab2-staging` into `main`. Ready for Lab 2 submission! | Merged |

---

## 2. Pull Requests I Reviewed for Partner (`@nannaphatkn`)

| PR Link | Partner Branch | Feature Reviewed | My Verdict | Detailed Comments Given | Partner Response & Action Taken | Status |
|---|---|---|---|---|---|---|
| [#12](https://github.com/nannaphatkn/toktickit/pull/12) | `feature/requester-selection` | Dev Requester Context Selector | `Approved` | **@Patitta-23:** "Great implementation of the Requester Context Selector! The dropdown correctly queries active users only (`status = ACTIVE`). Verified that switching requesters updates local state. **Suggestion:** Add a subtle loading spinner state while fetching requesters from `/api/requesters` to improve UX during slow queries." | **@nannaphatkn:** "Thanks for the feedback! Added loading spinner indicator while fetching API data and updated unit tests." | Merged |
| [#15](https://github.com/nannaphatkn/toktickit/pull/15) | `feature/ticket-submission` | Create Ticket Form & File Validation | `Approved` | **@Patitta-23:** "Reviewed ticket submission logic. Client-side validation for title, category, description, and attachment size limit (5MB) works correctly. Verified that files over 5MB or invalid MIME types are blocked before upload. **Observation:** Ensure error callouts stay visible if server fails so user doesn't lose inputs." | **@nannaphatkn:** "Thank you! Verified that form inputs remain populated upon server API errors and added error banner callout." | Merged |
| [#17](https://github.com/nannaphatkn/toktickit/pull/17) | `feature/ticket-list-filters` | My Tickets Search, Filter & Table View | `Approved` | **@Patitta-23:** "Verified My Tickets list filtering and pagination. Search query works well for both ticket ID and summary text. Category pills and status badges are color-coded clearly. **Nice to have:** Add a 'Clear Filters' button when filters are active." | **@nannaphatkn:** "Good suggestion! Implemented 'Clear Filters' reset button and merged to `lab2-staging`." | Merged |
| [#18](https://github.com/nannaphatkn/toktickit/pull/18) | `feature/attachment-soft-delete` | Ticket Detail & Attachment Soft-Delete | `Approved` | **@Patitta-23:** "Soft-delete functionality verified. Minimum 10-character reason validation is correctly enforced in the modal form. Soft-deleted attachments remain in DB with `deletedAt` timestamp and `deleteReason`. Download links work for active attachments." | **@nannaphatkn:** "Thanks for testing edge cases! Confirmed database persistence and merged into `lab2-staging`." | Merged |

---

## 3. Peer Review Checklist & Criteria Verification

During the code review process, both reviewers verified the code against the following standard checklist:

### A. Security & Data Isolation (IDOR Protection)
- [x] Every API endpoint checks caller identity (`X-Requester-Id`).
- [x] Requester A cannot view, update, or soft-delete tickets/attachments belonging to Requester B (returns HTTP 403 Forbidden).

### B. Input & File Validation
- [x] Title, Category, and Description required for ticket creation.
- [x] Attachment restrictions enforced: Maximum 5 files per ticket, <= 5 MB per file, allowed MIME types (`jpeg`, `png`, `webp`, `pdf`).
- [x] Soft-delete reason must be at least 10 characters long.

### C. Architecture & Code Quality
- [x] Modular separation between Client (`React` + `TypeScript` + `Vite`) and Server (`Express` + `Prisma` + `PostgreSQL`).
- [x] Shared Zen Green design system tokens applied via CSS custom properties (`index.css`).
- [x] No hardcoded localhost URLs in client components (uses relative paths `/api/...` with Vite proxy).

### D. Automated Testing & Verification
- [x] Unit/Integration tests written for backend API controllers (36 tests passing).
- [x] Frontend component tests written using Vitest + React Testing Library (11 tests passing).

---

## 4. Reflection & Summary

The peer review process between `@Patitta-23` and `@nannaphatkn` ensured high code quality, consistency in design token implementation, and strict adherence to specification business rules. Constructive feedback provided during PR reviews led to key UX improvements, such as explicit confirmation modals, loading spinner indicators, and filter reset options. All PRs were successfully reviewed, approved, and merged according to Definition of Done (DoD) guidelines.



