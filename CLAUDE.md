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
- 87.5% feature parity with Foam (Obsidian-like VS Code extension)

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

```
Quallaa-app/
├── applications/
│   ├── browser/          # Browser-based app (runs in web browser)
│   └── electron/         # Desktop app (macOS, Windows, Linux)
│
├── theia-extensions/     # Custom Theia extensions
│   ├── knowledge-base/   # 🔥 THE BIG ONE - All knowledge management features
│   ├── product/          # Branding, about dialog, getting started widget
│   ├── launcher/         # CLI launcher for AppImage builds
│   └── updater/          # Auto-update mechanism
│
├── docs/                 # Documentation
│   └── MERGING_UPSTREAM.md  # How to merge Theia updates
│
├── test-workspace/       # Sample workspace for testing features
│   └── .claude/          # Claude Code hooks for this workspace
│
├── logo/                 # Brand assets (SVG, PNG)
├── .github/
│   └── scripts/
│       └── merge-upstream.sh  # Automated merge script
│
├── .husky/               # Git hooks (pre-commit linting)
├── playwright.config.ts  # E2E test configuration
└── package.json          # Root package (Yarn workspace)
```

---

## The Knowledge Base Extension

**Location:** `theia-extensions/knowledge-base/`

This is the **crown jewel** of Quallaa - 28 files, ~3,500 lines of code.

### Features Implemented (87.5% Foam Parity)

**Wiki Links** (`src/browser/wiki-links/`)

- Double-bracket syntax: `[[Note Name]]` and `[[Note Name|Alias]]`
- Document link provider for navigation
- Autocomplete provider
- Visual styling

**Backlinks Panel** (`src/browser/backlinks/`)

- Shows all notes linking to current note
- Automatic bidirectional link detection
- Click to navigate to source

**Knowledge Graph** (`src/browser/graph/`)

- Interactive D3.js force-directed graph
- Zoom, pan, drag nodes
- Visual indicators for active vs. unresolved links
- Node sizing by connection count (degree centrality)
- Click to open notes

**Tags Browser** (`src/browser/tags/`)

- Hierarchical tag display (e.g., `#project/backend/api`)
- Real-time filtering
- Badge counts per tag

**Daily Notes** (`src/browser/daily-notes/`)

- Date-based note creation
- Template support

**Note Templates** (`src/browser/templates/`)

- 5 built-in templates (Meeting Notes, Project Note, etc.)
- 13 template variables (date, time, title, etc.)
- Interactive creation workflow

### Backend Architecture

**Indexing Service** (`src/node/knowledge-base-service-impl.ts` - 827 lines)

- Indexes all markdown files in workspace
- Parses wiki links and frontmatter
- Builds bidirectional link graph
- Watches for file changes with chokidar
- Provides query API for frontend

**Why Backend Service?**

- Efficient file watching for large repos (1000s of notes)
- Instant autocomplete without scanning files every time
- In-memory graph for fast queries

### Key Dependencies

- `d3@6.7.0` - Knowledge graph visualization
- `gray-matter@^4.0.3` - YAML frontmatter parsing
- `chokidar@^4.0.3` - File watching

---

## Development Workflows

### Building

```bash
# Development build (faster, less optimized)
yarn && yarn build:dev && yarn download:plugins

# Production build
yarn && yarn build && yarn download:plugins

# Build just extensions
yarn build:extensions

# Build just applications
yarn build:applications:dev
```

### Running

```bash
# Browser version
yarn browser start
# Visit http://localhost:3000/

# Electron preview
yarn electron package:preview

# Package installers
yarn package:applications
# Output in applications/electron/dist
```

### Testing

```bash
# Unit tests (knowledge base)
cd theia-extensions/knowledge-base
yarn test

# E2E tests (Playwright)
yarn test

# Specific E2E test
npx playwright test applications/browser/test/knowledge-graph.spec.ts
```

### Linting & Formatting

```bash
# Lint everything
yarn lint

# Auto-fix linting issues
yarn lint:fix

# Markdown linting
yarn lint:markdown

# Format with Prettier
yarn format

# Check formatting
yarn format:check
```

---

## Merging Upstream Theia Updates

**IMPORTANT:** Use the automated merge script!

```bash
.github/scripts/merge-upstream.sh
```

**What it does:**

1. Fetches upstream changes
2. Auto-resolves Quallaa-specific files (README, branding)
3. Regenerates yarn.lock
4. Shows remaining conflicts (usually package.json files)

**Manual Steps:**

- Resolve package.json conflicts:
    - **Keep:** name, author, license, URLs (Quallaa metadata)
    - **Accept:** version, @theia/\* dependency updates
    - **Keep:** quallaa-\*-ext dependencies

**Full guide:** See `docs/MERGING_UPSTREAM.md`

**Last merge:** Commit `5e06860` - Theia 1.65.1 → 1.66.1

---

## Key Files to Know

### Branding & Product Identity

- `theia-extensions/product/src/browser/branding-util.tsx` - Help text, welcome
  content
- `theia-extensions/product/src/browser/theia-ide-about-dialog.tsx` - About
  dialog
- `theia-extensions/product/src/browser/theia-ide-getting-started-widget.tsx` -
  Getting started
- `README.md` - Main project README (completely rewritten for Quallaa)

**Strategy:** Always keep ours during merges

### Application Configs

- `applications/browser/package.json` - Browser app dependencies & config
- `applications/electron/package.json` - Electron app dependencies & config
- `applications/electron/electron-builder.yml` - Electron build config

**Strategy:** Keep metadata, accept dependency updates

### Root Config

- `package.json` - Root workspace config
- `.eslintrc.js` - Added React & accessibility rules
- `.gitignore` - Excludes `knowledge-base/` private docs
- `playwright.config.ts` - E2E test config

---

## Common Tasks

### Add a New Feature to Knowledge Base Extension

1. Decide if it's frontend or backend
2. Create files in appropriate directory:
    - Frontend: `src/browser/<feature>/`
    - Backend: `src/node/`
    - Shared: `src/common/`
3. Register in module:
    - Frontend: `src/browser/knowledge-base-frontend-module.ts`
    - Backend: `src/node/knowledge-base-backend-module.ts`
4. Add CSS if needed: `src/browser/style/<feature>.css`
5. Write tests: `src/**/*.spec.ts`
6. Build: `yarn build:extensions`

### Debug the Application

**Browser:**

```bash
yarn browser start
# Open browser DevTools
```

**Electron:**

```bash
yarn electron start:debug
# Electron DevTools open automatically
```

### Add a New Theia Extension

1. Create directory: `theia-extensions/<name>/`
2. Add `package.json` with:
    - `name: "quallaa-<name>-ext"`
    - `license: "EPL-2.0"`
    - `theiaExtensions` pointing to module
3. Add to application dependencies
4. Run `yarn install`

### Update Icons/Logos

**Application Icons:**

- `applications/electron/resources/icon.icns` (macOS)
- `applications/electron/resources/icon.ico` (Windows)
- `applications/electron/resources/icons/` (various sizes)

**In-App Logos:**

- `theia-extensions/product/src/browser/icons/`
- Theme-aware: `quallaa-logo-light.png`, `quallaa-logo-dark.png`

**Splash Screen:**

- `applications/electron/resources/QuallaaIDESplash.svg`

---

## Important Conventions

### Naming

- **Packages:** `quallaa-<name>-ext` or `quallaa-<name>-app`
- **NOT:** `theia-ide-*` (that's upstream)

### Metadata

Always use Quallaa metadata in all `package.json` files:

```json
{
    "license": "EPL-2.0",
    "author": "Jeff Toffoli",
    "homepage": "https://github.com/jefftoffoli/Quallaa-app#readme",
    "bugs": { "url": "https://github.com/jefftoffoli/Quallaa-app/issues" },
    "repository": {
        "url": "git+https://github.com/jefftoffoli/Quallaa-app.git"
    }
}
```

### Configuration

- App name: `"Quallaa"` (not "Theia IDE")
- Config folder: `.quallaa` (not `.theia`)

### Knowledge Base Documentation

**The `knowledge-base/` directory** (in gitignore) contains private
architectural documentation written in natural language, NOT tutorials or
implementation guides.

**Documentation Philosophy:**

- **Purpose:** Provide high-level architectural context for AI assistants and
  developers
- **Style:** Natural language descriptions, physical metaphors, conceptual
  explanations
- **NOT:** Implementation tutorials, code examples, step-by-step guides

**What to include:**

- Architectural patterns and decisions
- Physical metaphors (e.g., "LEGO bricks", "Museum Curator")
- "What it is" and "Why we chose it" explanations
- ASCII diagrams and visual layouts
- Tables comparing approaches
- Design principles and tradeoffs
- Implementation roadmaps (checklists, not code)

**What to AVOID:**

- Detailed TypeScript/JavaScript code blocks
- CSS styling examples
- JSON configuration samples
- TSX component implementations
- Line-by-line code walkthroughs

**When code is necessary:**

- Use pseudo-code or bullet-point descriptions instead
- Describe WHAT the code does, not HOW to write it
- Example: "Factory creates widget instances with dependency injection" vs. full
  class implementation

**This policy applies ONLY to knowledge-base/ documentation.** The rest of the
project (theia-extensions/, applications/, etc.) should absolutely have proper
code implementations!

---

## File Patterns to Avoid Editing

These will conflict on every merge - **keep ours:**

- `README.md`
- `CONTRIBUTING.md`
- `LICENSE` (copyright line)
- `theia-extensions/product/src/browser/*.tsx`

These change frequently - **accept theirs:**

- `yarn.lock` (regenerate with `yarn install`)
- Version numbers in `package.json`
- `@theia/*` dependency versions

---

## Git Workflow

### Branches

- `master` - main development branch
- Upstream tracking: `upstream/master` →
  `https://github.com/eclipse-theia/theia-ide.git`

### Hooks

**Pre-commit** (`.husky/pre-commit`):

- Runs lint-staged
- Formats code with Prettier
- Lints modified files with ESLint
- Checks markdown with markdownlint

### Commit Messages

Use conventional commits when possible:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `chore:` - Maintenance
- `refactor:` - Code refactoring

**Include Claude attribution when AI-assisted:**

```
feat: add new feature

Description of changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Testing Strategy

### Unit Tests

- Location: `theia-extensions/knowledge-base/src/**/*.spec.ts`
- Run with: `yarn test` in extension directory
- Framework: Mocha + Chai
- Focus: Wiki link parser, knowledge base service

### E2E Tests

- Location: `applications/browser/test/*.spec.ts`
- Run with: `yarn test` in root
- Framework: Playwright
- Focus: UI interactions, knowledge graph, wiki link creation

### Test Workspace

- Location: `test-workspace/`
- Sample markdown files with wiki links
- Used for manual testing and E2E tests

---

## Dependencies to Be Aware Of

### Quallaa-Specific

- `@playwright/test` - E2E testing
- `prettier` - Code formatting
- `husky` - Git hooks
- `lint-staged` - Pre-commit linting
- `markdownlint-cli` - Markdown linting
- `eslint-plugin-jsx-a11y` - Accessibility linting
- `eslint-plugin-react` - React linting
- `d3` - Knowledge graph
- `gray-matter` - Frontmatter parsing

### Pinned Versions (in resolutions)

```json
"resolutions": {
  "**/d3": "6.7.0",
  "**/@types/d3": "6.7.0"
}
```

These are pinned to ensure knowledge graph compatibility.

---

## Known Issues & Gotchas

### The `knowledge-base/` Directory

**In .gitignore:**

```gitignore
# Private planning and strategy docs
knowledge-base/
```

This excludes a private documentation directory (different from the extension).

**Gotcha:** When staging `theia-extensions/knowledge-base/package.json`, you
need `-f`:

```bash
git add -f theia-extensions/knowledge-base/package.json
```

### Unit Test Failures

Some backend unit tests fail because they expect a real filesystem:

- 31 passing (wiki link parser)
- 16 failing (backend service - needs real workspace)

This is expected. The E2E tests validate actual functionality.

### Yarn Warnings

You'll see warnings about:

- Peer dependencies (React, TypeScript, etc.)
- Resolution field incompatibilities

These are safe to ignore - they're due to Theia's complex dependency tree.

---

## Architecture Decisions

### Why D3.js for Knowledge Graph?

- Mature, battle-tested force-directed graph library
- Works in both browser and Electron
- Rich interaction capabilities (zoom, pan, drag)
- Pinned to v6.7.0 for stability

### Why Backend Indexing Service?

- Scales to thousands of notes
- Instant autocomplete without file scanning
- File watching for real-time updates
- Separation of concerns (backend = data, frontend = UI)

### Why chokidar for File Watching?

- More reliable than Node's fs.watch
- Works across platforms (macOS, Windows, Linux)
- Handles large directories efficiently

### Why React for UI Components?

- Theia already uses React
- Rich component ecosystem
- Good TypeScript support
- Accessibility tooling (jsx-a11y)

---

## Future Plans

**Phase 2 Features:**

- WYSIWYG markdown editor
- Orphans detection widget
- Smart note suggestions
- Graph filtering and search
- Export to various formats

**See:** `PHASE_1_3_STATUS.md` for detailed roadmap

---

## Quick Reference Commands

```bash
# Fresh start
yarn clean && yarn install && yarn build:dev

# Test knowledge base
cd theia-extensions/knowledge-base && yarn test

# Merge upstream
.github/scripts/merge-upstream.sh

# Package for distribution
yarn package:applications

# Check dependencies
yarn list --pattern "quallaa-*"

# Find outdated packages
yarn outdated

# Clean everything (nuclear option)
yarn clean && rm -rf node_modules && yarn install
```

---

## Getting Help

**Documentation:**

- [Theia Documentation](https://theia-ide.org/docs/)
- [Theia API Docs](https://eclipse-theia.github.io/theia/docs/next/)
- [docs/MERGING_UPSTREAM.md](docs/MERGING_UPSTREAM.md) - Merge guide

**Community:**

- Theia Discussions: https://github.com/eclipse-theia/theia/discussions
- Theia Spectrum Chat: https://spectrum.chat/theia

**Quallaa Repo:**

- Issues: https://github.com/jefftoffoli/Quallaa-app/issues
- Wiki: (TBD)

---

## For AI Assistants

**When working on this project:**

1. **Always preserve Quallaa branding** - Never suggest changing back to "Theia
   IDE"
2. **Keep EPL-2.0 license** - All code must be EPL-2.0
3. **Follow existing patterns** - Knowledge base extension shows the
   architectural style
4. **Test after changes** - Run `yarn build:extensions` to verify
5. **Update this file** - If you make significant changes, update CLAUDE.md
6. **Check merge docs** - Before merging upstream, read
   `docs/MERGING_UPSTREAM.md`
7. **Respect .gitignore** - Don't commit `knowledge-base/` directory (private
   docs)
8. **Knowledge base documentation style** - RESIST adding code samples to
   `knowledge-base/` architecture docs. Use natural language, metaphors, and
   bullet points instead. See "Knowledge Base Documentation" section above. This
   does NOT mean avoiding code elsewhere - write proper implementations in
   `theia-extensions/` and `applications/`!

**Common requests:**

- "Add feature to knowledge base" → See "Add a New Feature" section
- "Merge upstream" → Use `.github/scripts/merge-upstream.sh`
- "Fix build" → Try `yarn clean && yarn build:dev`
- "Update branding" → Edit files in `theia-extensions/product/src/browser/`

---

**Last Updated:** 2025-11-10 (added knowledge-base documentation style guide)
**Quallaa Version:** 1.66.100 **Based on Theia:** 1.66.1
