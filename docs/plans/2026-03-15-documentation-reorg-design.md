# Documentation Reorganization Design

Date: 2026-03-15
Project: pomodoro-clock
Topic: README, AGENTS, and DESIGN document reorganization

## Goals

- Clarify the purpose of `README.md`, `AGENTS.md`, and `DESIGN.md`.
- Align all three documents with the current codebase after the renderer and main-process refactor.
- Reduce duplicated explanations across the documents.
- Make each document faster to use for its intended audience.

## Current Problems

### `README.md`

- It mixes user-facing product description with design commentary.
- Some design language is out of date relative to the current theme and implementation.
- It does not reflect the current renderer structure with `components`, `hooks`, `constants`, `types`, and `utils`.
- It does not clearly point readers to `AGENTS.md` and `DESIGN.md` for deeper context.

### `AGENTS.md`

- It still describes the application accurately at a high level, but it does not reflect the current renderer module boundaries.
- It does not tell agents that `src/App.tsx` is now a composition layer.
- It repeats some project-level information that is better suited to `README.md`.

### `DESIGN.md`

- It contains useful product and technical rationale, but parts of it describe the older code structure.
- It overlaps with both `README.md` and `AGENTS.md`.
- It should explain current layering and architecture rather than broad setup details.

## Evaluated Approaches

### 1. Role-separated documentation (recommended)

Assign a clear audience and responsibility to each document:

- `README.md` for users and contributors
- `AGENTS.md` for coding agents and maintainers
- `DESIGN.md` for architecture, product logic, and design rationale

Pros:

- easiest to scan
- lowest duplication over time
- best fit for the current project needs

Cons:

- requires deliberate trimming of repeated content
- requires cross-links between documents

### 2. README-centered documentation

Make `README.md` the main source of truth and keep `AGENTS.md` and `DESIGN.md` as short supplements.

Pros:

- simple entry point
- more self-contained for humans

Cons:

- duplication tends to come back quickly
- weak separation for agent-specific guidance

### 3. Full uniform rewrite

Rewrite all documentation in one language and one consistent template.

Pros:

- strongest consistency
- cleanest tone and formatting

Cons:

- larger rewrite than necessary
- not required to solve the core problem of audience separation

## Recommended Design

Use role-separated documentation with consistent terminology and light cross-references.

This project already has all the right document types. The main need is not to add more docs, but to sharpen the boundaries between the existing ones and update them to match the current architecture.

## Document Responsibilities

### `README.md`

Audience:

- first-time visitors
- users
- contributors

Responsibilities:

- explain what the app is
- show main features and screenshots
- document install, development, build, and release commands
- provide a current project structure overview
- link to `AGENTS.md` and `DESIGN.md` for deeper reference

Should avoid:

- deep internal state-flow explanation
- long-form design rationale
- agent workflow rules

### `AGENTS.md`

Audience:

- AI coding agents
- maintainers working through automated workflows

Responsibilities:

- describe the current codebase structure and responsibilities
- document key commands and verification expectations
- explain current code style and module boundaries
- call out important architecture and security constraints for safe changes

Should avoid:

- marketing-style feature descriptions
- repeated setup prose already covered by `README.md`
- deep product rationale better kept in `DESIGN.md`

### `DESIGN.md`

Audience:

- developers or maintainers trying to understand why the app is structured this way
- people modifying UX, timer behavior, or Electron integration

Responsibilities:

- explain design goals and interaction philosophy
- document timer behavior and business rules
- explain current renderer layering and main-process responsibilities
- explain IPC, follow mode, notifications, and technical trade-offs

Should avoid:

- repeating install and build instructions in detail
- repeating agent workflow guidance

## Proposed Structures

### `README.md`

Suggested sections:

1. Title and one-sentence summary
2. Screenshots
3. Core features
4. Tech stack
5. Quick start
6. Development, build, and release commands
7. Current project structure
8. Documentation map
9. License

### `AGENTS.md`

Suggested sections:

1. Project overview
2. Current architecture
3. Directory responsibilities
4. Build and verification commands
5. Code style and change constraints
6. Testing status and expected verification
7. Security notes
8. Configuration references

### `DESIGN.md`

Suggested sections:

1. Design goals
2. Interaction and visual principles
3. Pomodoro business rules
4. Renderer architecture
5. Main-process architecture
6. IPC and synchronization model
7. Follow mode design
8. Notifications and audio feedback
9. Key trade-offs and non-goals

## Terminology and Consistency Rules

Use consistent labels across documents:

- Focus / Break
- Follow Mouse Mode / follow mode
- Main Process / Renderer Process
- composition layer
- hooks / components / constants / types / utils

Each document should use the same names for core modules and behaviors.

## Validation Criteria

The reorganization is successful when:

- `README.md` quickly explains what the app does and how to run it
- `AGENTS.md` reflects the current architecture, especially the renderer split and `src/App.tsx` role
- `DESIGN.md` explains current behavior and architecture rather than old structure
- large duplicated passages are removed
- each document clearly points readers to the others when deeper context is needed

## Non-Goals

- no code changes
- no new top-level documentation files unless strictly needed
- no rewrite of screenshots or asset paths
- no product redesign hidden inside doc cleanup

## Implementation Notes

Suggested order:

1. update `README.md` as the public entry point
2. update `AGENTS.md` to reflect current engineering structure
3. update `DESIGN.md` to reflect current product and architecture rationale
4. do a final consistency pass across all three files

This order keeps the public-facing entry point accurate first, then aligns the internal guidance and design reference documents around it.
