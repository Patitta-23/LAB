# Lab 2 — AI Use Log

**Author:** Patitta Daensikaew — 67070505221  
**Course:** CPE 334  

---

## How to Use This Document

For every AI-assisted session, add an entry below. Record:
1. **What I asked the AI to do** — the prompt or task
2. **What the AI produced** — the output (code, text, plan, etc.)
3. **What I changed or reviewed** — how I verified, adapted, or corrected the AI output
4. **What I learned** — reflection on the session

---

## Session Log

### Session 1 — 2026-09-03
**Tool used:** Antigravity (Google Deepmind)

**Task:** Setting up Lab 2 git workflow and creating Spec DD documentation

**What I asked the AI:**
- Help fix the git state (uncommitted Lab 1 files carried over to lab2-staging)
- Guide the steps for Spec-Driven Development
- Create initial spec documents: specification.md, ui-spec.md, api-spec.md, tests.md, reviewer.md, ai-use.md

**What the AI produced:**
- Step-by-step git commands to clean up the dirty branch (stash → delete branch → commit on main → recreate branch)
- 5 specification documents covering business rules, functional requirements, acceptance criteria, API endpoints, UI design tokens, and test matrix

**What I changed or reviewed:**
- Verified git status after each command
- Reviewed spec content for accuracy against lab requirements

**What I learned:**
- Always commit or stash before switching branches to avoid carrying over changes
- Spec DD requires creating documentation with a git timestamp BEFORE writing any implementation code — this is how the spec serves as a contract
