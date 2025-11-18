# Quallaa - Claude Code Context

> **AI Assistant Context Document** This file helps Claude Code and other AI
> assistants understand the Quallaa project structure, development workflows,
> and key decisions.

---

## Project Overview

**Quallaa** is a knowledge-first IDE for natural language developers, built as a
**fork** (not extension) of Eclipse Theia IDE.

**Key Philosophy:**

- Traditional IDEs assume you're writing code
- Quallaa assumes you're building a knowledge base that happens to be executable
- Think Obsidian meets VS Code

**Target Users:**

- Natural language developers who think in markdown
- AI-assisted coders (Claude, ChatGPT, etc.)
- Technical writers and researchers
- Anyone who prefers knowledge graphs over file trees

**Current Status:**

- Based on Theia v1.66.1
- Version: 1.66.100
- License: EPL-2.0
- Priority 1 complete (KB View default mode)
- See `knowledge-base/CURRENT_STATUS.md` for detailed status
- See `knowledge-base/FEATURES.md` for complete feature list

---

## Why a Fork (Not an Extension)?

Quallaa is a **fork** because we need complete control over:

- Default UI/UX behaviors
- Product branding and messaging
- Getting started experience
- Menu structure and commands
- Progressive disclosure of IDE features

This is fundamentally different from a typical Theia extension.

---

## Repository Structure

**Key Directories:**

- `applications/` - Browser and Electron apps
- `theia-extensions/` - Custom extensions (knowledge-base, product, kb-view,
  launcher, updater)
- `knowledge-base/` - Documentation (excluded from git - private planning docs)
- `docs/` - Technical documentation
- `test-workspace/` - Sample workspace for testing
- `.github/scripts/` - Automation scripts (merge-upstream.sh)

**Main Extensions:**

- `knowledge-base/` - Wiki links, backlinks, graph, tags, templates, daily notes
- `kb-view/` - Mode system, state management, widget management
- `product/` - Branding, Getting Started widget

_(See actual directory structure in source)_

---

## Core Extensions

### Knowledge Base Extension (`theia-extensions/knowledge-base/`)

The **crown jewel** of Quallaa - comprehensive knowledge management features.

**Implemented Features:**

- Wiki Links: `[[Note Name]]` syntax with autocomplete
- Backlinks Panel: Shows incoming links
- Knowledge Graph: D3.js force-directed visualization
- Tags Browser: Hierarchical tags with counts
- Daily Notes: Date-based note creation
- Templates: 5 built-in, 13 variables

**Backend Architecture:**

- Indexing service (827 lines) - Indexes markdown files, builds link graph
- File watching with chokidar for real-time updates
- In-memory graph for instant autocomplete

**See:** `knowledge-base/FEATURES.md` for complete feature list and
implementation status

### KB View Extension (`theia-extensions/kb-view/`)

Mode system for knowledge-first vs developer experience.

**Core Services:**

- `ViewModeService` - Mode switching with lazy initialization
- `ModeStateManager` - State capture/restore per mode
- `KBViewWidgetManager` - Widget visibility management
- `KBViewPreferences` - 17 configuration options

**What KB View Mode Does:**

- Hides developer UI (Terminal, Debug, SCM icons)
- Shows Tags (left) + Backlinks (right) by default
- Applies warm color palette, Georgia font
- Hides .md extensions

**See:** `knowledge-base/Architecture/KB-Widget-System.md` for architecture
details

---

## Development Workflows

**Building:**

- Development: `yarn && yarn build:dev && yarn download:plugins`
- Production: `yarn && yarn build && yarn download:plugins`
- Extensions only: `yarn build:extensions`
- Applications only: `yarn build:applications:dev`

**Running:**

- Browser: `yarn browser start` (http://localhost:3000)
- Electron: `yarn electron package:preview`
- Package: `yarn package:applications` (output in `applications/electron/dist`)

**Testing:**

- Unit: `cd theia-extensions/knowledge-base && yarn test`
- E2E: `yarn test` (Playwright)
- Specific: `npx playwright test <test-file>`

**Linting:**

- Check: `yarn lint`
- Fix: `yarn lint:fix`
- Markdown: `yarn lint:markdown`
- Format: `yarn format`

_(See package.json scripts for complete command list)_

---

## Merging Upstream Theia Updates

**Script:** `.github/scripts/merge-upstream.sh` (use this, not manual merge)

**What it does:**

- Fetches upstream changes
- Auto-resolves Quallaa-specific files (README, branding)
- Regenerates yarn.lock
- Shows remaining conflicts (usually package.json)

**Merge Strategy:**

- **Keep:** Quallaa metadata (name, author, license, URLs, quallaa-\* deps)
- **Accept:** Theia version updates, @theia/\* dependency versions

**Full guide:** `docs/MERGING_UPSTREAM.md`

---

## Key File Patterns

**Branding (Always keep ours during merges):**

- `theia-extensions/product/src/browser/*.tsx` - All UI branding
- `README.md` - Quallaa-specific
- `CONTRIBUTING.md`, `LICENSE` - Quallaa-specific

**Config (Keep metadata, accept dependency updates):**

- `applications/*/package.json` - App configs
- `package.json` - Root workspace
- `electron-builder.yml` - Build config

**Quallaa-Specific:**

- `.eslintrc.js` - React & accessibility rules
- `.gitignore` - Excludes `knowledge-base/` private docs
- `playwright.config.ts` - E2E config

---

## Common Tasks

**Add Feature to Knowledge Base Extension:**

- Frontend: `src/browser/<feature>/` → Register in
  `knowledge-base-frontend-module.ts`
- Backend: `src/node/` → Register in `knowledge-base-backend-module.ts`
- CSS: `src/browser/style/<feature>.css`
- Tests: `src/**/*.spec.ts`
- Build: `yarn build:extensions`

**Debug:**

- Browser: `yarn browser start` (use DevTools)
- Electron: `yarn electron start:debug` (DevTools auto-open)

**Add New Extension:**

- Create `theia-extensions/<name>/` with `package.json` (name:
  `quallaa-<name>-ext`, license: EPL-2.0)
- Add to application dependencies
- Run `yarn install`

**Update Branding:**

- App icons: `applications/electron/resources/` (.icns, .ico, icons/)
- In-app logos: `theia-extensions/product/src/browser/icons/` (theme-aware)
- Splash: `applications/electron/resources/QuallaaIDESplash.svg`

---

## Important Conventions

**Naming:**

- Packages: `quallaa-<name>-ext` or `quallaa-<name>-app` (NOT `theia-ide-*`)
- App name: `"Quallaa"` (not "Theia IDE")
- Config folder: `.quallaa` (not `.theia`)

**Metadata (all package.json files):**

- License: EPL-2.0
- Author: Jeff Toffoli
- URLs: github.com/jefftoffoli/Quallaa-app

**Merge Conflict Patterns:**

- **Keep ours:** README, CONTRIBUTING, LICENSE, branding files
- **Accept theirs:** yarn.lock, version numbers, @theia/\* dependencies

---

## Git Workflow

**Branches:**

- `master` - main development
- Upstream: `upstream/master` → eclipse-theia/theia-ide.git

**Pre-commit Hooks (.husky):**

- Runs lint-staged, Prettier, ESLint, markdownlint

**Commit Messages:**

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Include Claude attribution for AI-assisted work
- _(See actual commit examples in git log)_

---

## Testing

**Unit Tests:**

- Location: `theia-extensions/knowledge-base/src/**/*.spec.ts`
- Run: `yarn test` (in extension dir)
- Framework: Mocha + Chai
- Focus: Wiki link parser, knowledge base service

**E2E Tests:**

- Location: `applications/browser/test/*.spec.ts`
- Run: `yarn test` (in root)
- Framework: Playwright
- Focus: UI interactions, mode switching, widgets

**Test Workspace:** `test-workspace/` (sample markdown files for testing)

---

## Key Dependencies

**Quallaa-Specific:**

- Testing: `@playwright/test`
- Linting: `prettier`, `husky`, `lint-staged`, `markdownlint-cli`,
  `eslint-plugin-jsx-a11y`, `eslint-plugin-react`
- Knowledge Base: `d3@6.7.0` (pinned), `gray-matter`, `chokidar`

**Pinned Versions:** d3@6.7.0 (knowledge graph compatibility) _(See package.json
resolutions for complete list)_

---

## Known Issues

**knowledge-base/ Directory:**

- In .gitignore (private docs, different from extension)
- Staging extension files requires:
  `git add -f theia-extensions/knowledge-base/package.json`

**Unit Tests:**

- Some backend tests fail (expect real filesystem)
- E2E tests validate actual functionality

**Yarn Warnings:**

- Peer dependency warnings (safe to ignore)
- Due to Theia's complex dependency tree

---

## Architecture

**Key Patterns:**

- **Backend Indexing:** Scales to thousands of notes, instant autocomplete
- **Mode System:** KB View vs Developer with state capture/restore
- **Lazy Initialization:** Avoids async DI issues (ViewModeService pattern)
- **Dual Sidebars:** Left + right simultaneously (Theia native)

**Technology Choices:**

- **D3.js:** Knowledge graph (pinned v6.7.0 for stability)
- **chokidar:** File watching (cross-platform, efficient)
- **React:** UI components (Theia standard, good TypeScript/a11y support)

**See:** `knowledge-base/Architecture/` for detailed architectural decisions

---

## Next Priorities

**Priority 2:** Named Workspace Layouts (beyond KB View/Developer) **Priority
3:** WYSIWYG markdown editor (live preview mode)

**See:** `knowledge-base/CURRENT_STATUS.md` for detailed next steps and roadmap

---

## Quick Commands

- Fresh start: `yarn clean && yarn install && yarn build:dev`
- Test extension: `cd theia-extensions/knowledge-base && yarn test`
- Merge upstream: `.github/scripts/merge-upstream.sh`
- Package: `yarn package:applications`
- Check deps: `yarn list --pattern "quallaa-*"`
- Outdated: `yarn outdated`
- Nuclear: `yarn clean && rm -rf node_modules && yarn install`

---

## Resources

**Documentation:**

- Theia docs: theia-ide.org/docs
- Merge guide: `docs/MERGING_UPSTREAM.md`
- Knowledge base: `knowledge-base/` directory

**Issues:** github.com/jefftoffoli/Quallaa-app/issues

---

## For AI Assistants

**Essential Rules:**

1. **Always preserve Quallaa branding** - Never suggest reverting to "Theia IDE"
2. **Keep EPL-2.0 license** - All code must be EPL-2.0
3. **Follow existing patterns** - See knowledge-base extension for architectural
   style
4. **Test after changes** - Run `yarn build:extensions`
5. **Update this file** - Keep CLAUDE.md current with significant changes
6. **Respect .gitignore** - Don't commit `knowledge-base/` directory (private
   docs)
7. **Use knowledge-base/** - Check `knowledge-base/CURRENT_STATUS.md` and
   `knowledge-base/FEATURES.md` for current state

**Common Requests:**

- Add feature → See "Common Tasks" section above
- Merge upstream → `.github/scripts/merge-upstream.sh` (see
  `docs/MERGING_UPSTREAM.md`)
- Fix build → `yarn clean && yarn build:dev`
- Update branding → `theia-extensions/product/src/browser/`
- Current status → `knowledge-base/CURRENT_STATUS.md`
- Feature list → `knowledge-base/FEATURES.md`
- Architecture → `knowledge-base/Architecture/`

---

**Last Updated:** 2025-11-16 (Priority 1 complete) **Quallaa Version:** 1.66.100
**Based on Theia:** 1.66.1
