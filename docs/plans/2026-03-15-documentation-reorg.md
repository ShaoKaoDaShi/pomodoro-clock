# Documentation Reorganization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize `README.md`, `AGENTS.md`, and `DESIGN.md` so each document serves a clear audience and matches the current codebase.

**Architecture:** Keep the existing three-document setup, but rewrite each file around a distinct role: user-facing overview, agent-facing engineering guidance, and architecture/design reference. Remove duplicated explanations, add light cross-references, and update all descriptions to match the current renderer and Electron structure.

**Tech Stack:** Markdown, Electron, React 19, TypeScript, Tailwind CSS v4, pnpm

---

### Task 1: Baseline documentation audit

**Files:**
- Check: `README.md`
- Check: `AGENTS.md`
- Check: `DESIGN.md`
- Reference: `docs/plans/2026-03-15-documentation-reorg-design.md`

**Step 1: Inspect current git state**

Run: `git status --short`
Expected: See whether there are unrelated user changes that must be preserved.

**Step 2: Record current documentation responsibilities**

Create a local checklist from the design doc:

- `README.md` is public entry point
- `AGENTS.md` is agent and maintainer guidance
- `DESIGN.md` is product and architecture rationale
- minimal duplication across files
- terminology aligned with current codebase

**Step 3: Verify the current build before doc changes**

Run: `pnpm build`
Expected: PASS. This confirms the repository is healthy before documentation edits.

**Step 4: Commit**

No commit expected for this task.

### Task 2: Rewrite `README.md` as the public entry point

**Files:**
- Modify: `README.md`
- Reference: `DESIGN.md`
- Reference: `AGENTS.md`

**Step 1: Write the structural target**

Set the target structure for `README.md`:

- title and summary
- screenshots
- core features
- tech stack
- quick start
- development/build/release commands
- current project structure
- documentation map
- license

Expected: temporary inconsistency while sections are being reordered or rewritten.

**Step 2: Run build before editing to preserve a clean baseline**

Run: `pnpm build`
Expected: PASS.

**Step 3: Rewrite `README.md` minimally but completely**

Requirements:

- keep screenshot paths intact
- remove outdated design details that belong in `DESIGN.md`
- update the project structure to include:
  - `electron/`
  - `src/components/`
  - `src/hooks/`
  - `src/constants/`
  - `src/types/`
  - `src/utils/`
- document release usage accurately, including `pnpm release`
- add a short documentation map linking `AGENTS.md` and `DESIGN.md`

**Step 4: Run build to verify repository still passes**

Run: `pnpm build`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: rewrite readme as public entry point"
```

### Task 3: Update `AGENTS.md` to match the current architecture

**Files:**
- Modify: `AGENTS.md`
- Reference: `src/App.tsx`
- Reference: `src/hooks/usePomodoroTimer.ts`
- Reference: `src/hooks/useTimerSync.ts`
- Reference: `src/hooks/useWindowControls.ts`
- Reference: `electron/main.ts`

**Step 1: Write the structural target**

Set the target structure for `AGENTS.md`:

- project overview
- current architecture
- directory responsibilities
- build and verification commands
- code style and change constraints
- testing status and verification expectations
- security notes
- configuration references

Expected: temporary inaccuracy while old sections are being replaced.

**Step 2: Run build before editing**

Run: `pnpm build`
Expected: PASS.

**Step 3: Rewrite `AGENTS.md` to reflect current code organization**

Requirements:

- state that `src/App.tsx` is primarily a composition layer
- document responsibilities of:
  - `src/components/`
  - `src/hooks/`
  - `src/constants/`
  - `src/types/`
  - `src/utils/`
- update Electron main-process notes so they match the current helper-oriented organization inside `electron/main.ts`
- keep the current security warning about `nodeIntegration` and `contextIsolation`
- avoid repeating public-facing product copy from `README.md`

**Step 4: Run build to verify repository still passes**

Run: `pnpm build`
Expected: PASS.

**Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update agent guidance for current architecture"
```

### Task 4: Rewrite `DESIGN.md` as the architecture and rationale reference

**Files:**
- Modify: `DESIGN.md`
- Reference: `README.md`
- Reference: `AGENTS.md`
- Reference: `src/hooks/usePomodoroTimer.ts`
- Reference: `src/hooks/useTimerSync.ts`
- Reference: `src/hooks/useWindowControls.ts`
- Reference: `electron/main.ts`

**Step 1: Write the structural target**

Set the target structure for `DESIGN.md`:

- design goals
- interaction and visual principles
- pomodoro business rules
- renderer architecture
- main-process architecture
- IPC and synchronization model
- follow mode design
- notifications and audio feedback
- trade-offs and non-goals

Expected: temporary mismatch while the old sections are being replaced.

**Step 2: Run build before editing**

Run: `pnpm build`
Expected: PASS.

**Step 3: Rewrite `DESIGN.md` to match the current implementation**

Requirements:

- preserve useful product rationale from the existing doc
- update technical descriptions so they match the current hooks/components structure
- explain follow mode using the current main-process and renderer responsibilities
- explain timer synchronization in terms of state ownership and IPC responsibilities
- remove setup/build instructions that are already covered in `README.md` and `AGENTS.md`

**Step 4: Run build to verify repository still passes**

Run: `pnpm build`
Expected: PASS.

**Step 5: Commit**

```bash
git add DESIGN.md
git commit -m "docs: refresh design reference for current codebase"
```

### Task 5: Final consistency pass across all documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `DESIGN.md`
- Reference: `docs/plans/2026-03-15-documentation-reorg-design.md`

**Step 1: Define the final review checklist**

Check all of the following:

- no large duplicated paragraphs across documents
- terms are consistent:
  - Focus / Break
  - Follow Mouse Mode / follow mode
  - Main Process / Renderer Process
  - composition layer
  - hooks / components / constants / types / utils
- README points to `AGENTS.md` and `DESIGN.md`
- AGENTS points to architecture-relevant files and constraints
- DESIGN explains rationale without repeating setup instructions

**Step 2: Review all three files together**

Run: no command required; do a direct file review.
Expected: identify wording mismatches or repeated sections.

**Step 3: Apply the minimal cleanup edits**

Examples:

- normalize section names
- tighten repeated sentences
- fix cross-links
- align command wording
- update stale file references

**Step 4: Run build to verify repository still passes**

Run: `pnpm build`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md AGENTS.md DESIGN.md
git commit -m "docs: align core project documentation"
```

### Task 6: Final verification and review handoff

**Files:**
- Check: `README.md`
- Check: `AGENTS.md`
- Check: `DESIGN.md`
- Check: `docs/plans/2026-03-15-documentation-reorg-design.md`
- Check: `docs/plans/2026-03-15-documentation-reorg.md`

**Step 1: Run the final build**

Run: `pnpm build`
Expected: PASS.

**Step 2: Inspect final git status**

Run: `git status --short && git diff --stat`
Expected: only intended documentation files are modified.

**Step 3: Spot-check final document roles**

Manual check:

- `README.md` reads like the public project entry point
- `AGENTS.md` reads like operational guidance for agents and maintainers
- `DESIGN.md` reads like architecture and rationale reference

**Step 4: Commit any last wording fix only if needed**

```bash
git add README.md AGENTS.md DESIGN.md
git commit -m "docs: finalize documentation reorganization"
```

Only do this if the final review requires a tiny follow-up edit.
