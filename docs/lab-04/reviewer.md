# Lab 4 — Peer Review Record

**Project:** TokTickIT — Ticket Detail & Action System  
**Author:** Patitta Daensikaew — 67070505221 — GitHub: [@Patitta-23](https://github.com/Patitta-23)  
**Reviewer:** @nannaphatkn  
**Course:** CPE 334  
**Sprint:** Lab 4

---

## Pull Requests (Lab 4)

### My PRs (Author: @Patitta-23)

| PR Link | Branch | Description & Scope | Reviewer Verdict | Detailed Comments Received | Author Response & Action Taken | Status |
|---|---|---|---|---|---|---|
| [#41](https://github.com/Patitta-23/LAB/pull/41) | `feature/lab4-spec` | **Spec DD Baseline Documentation**<br>• specification.md, api-spec.md, ui-spec.md<br>• tests.md, reviewer.md, ai-use.md | ✅ Approved | **@nannaphatkn:** "เริ่ด" | ขอบคุณค่ะ ตรวจสอบและเริ่มพัฒนาระบบตามสเปคทันที | Merged |
| [#44](https://github.com/Patitta-23/LAB/pull/44) | `feature/lab4-claim-reassign` | **Ticket Claim & Reassign System**<br>• Claim auto-transitions to IN_PROGRESS<br>• Reassign dropdown with IT Staff list API<br>• 13 vitest tests (CLM-01..13) | ✅ Approved | **@nannaphatkn:** "well done" | ขอบคุณค่ะ ทุกเทสต์ผ่าน 13/13 เรียบร้อย | Merged |
| [#45](https://github.com/Patitta-23/LAB/pull/45) | `feature/lab4-status-priority` | **Status State Machine & IT Priority**<br>• State machine transition validation<br>• IT Priority update (IT Staff + Admin)<br>• Structured error codes (400, 422)<br>• 23 vitest tests (STS-01..23) | ✅ Approved | **@nannaphatkn:** "slayyy" | ขอบคุณค่ะ State machine ทำงานถูกต้อง 100% | Merged |
| [#46](https://github.com/Patitta-23/LAB/pull/46) | `feature/lab4-comments` | **Unified Comments & Requester Resolve**<br>• Unified comments thread (PUBLIC / INTERNAL)<br>• Requester resolve endpoint with IDOR guard<br>• 23 vitest tests (CMT-01..10, RSLV-01..06) | ✅ Approved | **@nannaphatkn:** "goooodddd jobbb" | ขอบคุณค่ะ ทดสอบ IDOR และการแยกสิทธิ์เรียบร้อย | Merged |
| [#47](https://github.com/Patitta-23/LAB/pull/47) | `feature/lab4-requester-actions` | **Requester Actions, RBAC & Client UI Tests**<br>• RAC & formal RBAC evidence test suites<br>• 18 Client UI tests (ItStaff, Requester, Comments)<br>• Safe failure & error codes across legacy endpoints | ✅ Approved | **@nannaphatkn:** "approved" | ขอบคุณค่ะ รวมเทสต์ทั้งระบบ 184 ข้อผ่านหมด | Merged |
| [#54](https://github.com/Patitta-23/LAB/pull/54) | `lab4-staging` | **Final Lab 4 Staging Consolidation into Main**<br>• Full consolidation of all Lab 4 branches<br>• 184/184 tests passed (143 server + 41 client)<br>• Zero regression across Labs 1-3 | ✅ Approved | **@nannaphatkn:** "gooood" | ขอบคุณมากค่ะ ดำเนินการ Merge เข้า main สมบูรณ์แล้ว | Merged |

---

## Reviewer Checklist (for @nannaphatkn)

### Spec Review (`feature/lab4-spec`)
- [x] Business Rules cover all 7 Lab 4 features
- [x] API endpoints documented with request/response and error codes
- [x] Role permission matrix is complete and accurate
- [x] Test cases cover happy path + edge cases + RBAC
- [x] UI spec has layouts for both IT Staff and Requester

### Code Review (each feature PR)
- [x] Code follows existing project conventions (TypeScript, naming, structure)
- [x] RBAC guards applied at the route/middleware level (not just UI)
- [x] No hardcoded secrets or credentials
- [x] Error handling returns structured JSON, not stack traces
- [x] Tests actually fail when the feature is broken (not just green-washing)
- [x] No regression in existing Lab 2 / Lab 3 tests

---

## Partner PRs Reviewed (Author: @nannaphatkn)

| PR # | Description | My Review Comment |
|------|-------------|-------------------|
| TBD | _(to be filled when partner opens PRs)_ | |

---

## Review Notes

_(To be updated as reviews are completed)_

