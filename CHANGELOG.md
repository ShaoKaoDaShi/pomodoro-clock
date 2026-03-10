# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-10

### Added
- **UI Overhaul**: Redesigned the entire user interface using Tailwind CSS v4.
    - Added dynamic gradient backgrounds for Focus (Warm) and Break (Cool) modes.
    - Implemented modern card-style layout with rounded corners and soft shadows.
    - Added micro-interactions for buttons (hover, active states).
- **Mini Mode**: Enhanced "Follow Mouse" mode with a minimal, transparent design.
- **Documentation**: Added `DESIGN.md` detailing design philosophy and business logic.
- **Documentation**: Added `AGENTS.md` for project architecture overview.

### Changed
- **Architecture**: Migrated codebase to Vite + React + TypeScript.
- **Build System**: Updated `package.json` to include auto-version bumping on build.
- **Performance**: Optimized rendering with React functional components and hooks.

### Removed
- Legacy vanilla JavaScript files (`main.js`, `renderer.js`).
- Legacy CSS files (`main.css`, `input.css`).
