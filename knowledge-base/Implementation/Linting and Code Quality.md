# Linting and Code Quality

**Last Updated:** 2025-10-26

## Overview

Quallaa maintains code quality through a multi-layered linting system combining TypeScript, ESLint, Prettier, and specialized tools for our knowledge-first IDE features.

## Current Setup (Inherited from Theia)

### ESLint Configuration

**Location:** `.eslintrc.js` extends multiple config files in `configs/`

**Core Configs:**
- `base.eslintrc.json` - TypeScript parser, plugins, environment
- `errors.eslintrc.json` - Error-level rules (quotes, semi, max-len: 180)
- `warnings.eslintrc.json` - Warning-level rules
- `xss.eslintrc.json` - Security rules (XSS prevention, no-eval)

**Key Plugins:**
- `@typescript-eslint` - TypeScript-specific linting
- `eslint-plugin-import` - Import/export validation
- `eslint-plugin-no-null` - Enforce `undefined` over `null` (Theia convention)
- `eslint-plugin-no-unsanitized` - XSS protection
- `eslint-plugin-react` - Basic React rules
- `eslint-plugin-deprecation` - Flag deprecated APIs (critical for Theia updates)

**Important Rules:**
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-definitions": "error",
  "max-len": ["error", { "code": 180 }],
  "curly": "error",
  "eqeqeq": ["error", "smart"]
}
```

### Security Focus

The `xss.eslintrc.json` config prevents common security vulnerabilities:
- No `dangerouslySetInnerHTML` without sanitization
- No `eval()` or implied eval
- React danger props flagged as warnings
- DOMPurify.sanitize recognized as safe escape method

## Quallaa Additions (Phase 1) ✅

### 1. Prettier (Auto-formatting)

**Why:** Eliminates style debates, keeps PRs focused on logic not formatting

**Config:** `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 180,
  "tabWidth": 4,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "printWidth": 80,
        "proseWrap": "always"
      }
    }
  ]
}
```

**Integration:** Runs via `lint-staged` on git commit

### 2. React Hooks Rules

**Why:** Our UI components use React hooks extensively

**Rules:**
```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 3. Pre-commit Hooks (Husky + lint-staged)

**Why:** Catch issues before they hit the repo

**Config:** `.lintstagedrc.json`
```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,yml,md}": ["prettier --write"],
  "*.css": ["prettier --write"]
}
```

## Future Additions (Planned)

### Phase 2: Knowledge-First Features (Before Beta)

#### Markdown Linting
**Package:** `markdownlint-cli`

**Why:** Dogfooding - validate our own knowledge base and user markdown

**Rules:**
- Consistent heading style
- No trailing whitespace
- Alt text on images
- Valid wiki link syntax `[[Note Name]]`

**Custom rules to write:**
- `quallaa/wiki-link-syntax` - Enforce `[[Note]]` format
- `quallaa/broken-wiki-links` - Flag links to non-existent notes
- `quallaa/orphan-notes` - Warn about notes with no backlinks

#### Accessibility (a11y)
**Package:** `eslint-plugin-jsx-a11y`

**Why:** IDEs must be accessible (screen readers, keyboard nav)

**Key rules:**
- `jsx-a11y/click-events-have-key-events`
- `jsx-a11y/no-static-element-interactions`
- `jsx-a11y/alt-text`

### Phase 3: Polish (Future)

#### CSS Linting
**Package:** `stylelint`

**When:** After branding/theming stabilizes

#### Commit Message Linting
**Package:** `@commitlint/cli`

**When:** When accepting external contributions

**Scopes:**
```
feat(wiki-links): add autocomplete
fix(backlinks): update index atomically
docs(knowledge-base): update architecture
refactor(branding): consolidate logo assets
```

## Quallaa-Specific Rules (Custom)

When implementing knowledge management features, consider these custom rules:

### 1. File Path Handling
```typescript
// Bad - hardcoded paths
const notePath = '/Users/user/notes/file.md';

// Good - use FileService
const noteUri = this.fileService.resolve(workspaceUri, 'file.md');
```

**Rule:** `quallaa/no-hardcoded-paths` (error)

### 2. Index Updates
```typescript
// Bad - non-atomic index update
this.linkIndex.delete(oldLink);
// ... other operations ...
this.linkIndex.add(newLink);

// Good - atomic update
this.linkIndex.update(oldLink, newLink);
```

**Rule:** `quallaa/atomic-index-updates` (error)

### 3. Wiki Link Format
```typescript
// Bad - direct string manipulation
const link = '[[' + noteName + ']]';

// Good - use WikiLinkFormatter
const link = this.wikiLinkFormatter.format(noteName);
```

**Rule:** `quallaa/use-wiki-link-api` (warn)

## Running Linters

### Manual Commands
```bash
# Lint all code
yarn lint

# Lint and auto-fix
yarn lint:fix

# Format all code
yarn format

# Check formatting without changes
yarn format:check

# Lint markdown (future)
yarn lint:markdown
```

### Automatic (Pre-commit)
Husky runs `lint-staged` on `git commit`, which:
1. Lints only staged files
2. Auto-fixes what it can
3. Formats with Prettier
4. Blocks commit if errors remain

### CI/CD Integration (Future)
```yaml
# .github/workflows/lint.yml
- name: Lint TypeScript
  run: yarn lint

- name: Check formatting
  run: yarn format:check

- name: Lint markdown
  run: yarn lint:markdown
```

## Configuration Files

```
.
├── .eslintrc.js              # Root ESLint config
├── .prettierrc.json          # Prettier config
├── .lintstagedrc.json        # Pre-commit lint config
├── .husky/                   # Git hooks
│   └── pre-commit
├── configs/
│   ├── base.eslintrc.json    # Base TypeScript + plugins
│   ├── errors.eslintrc.json  # Error-level rules
│   ├── warnings.eslintrc.json # Warning-level rules
│   ├── xss.eslintrc.json     # Security rules
│   └── react.eslintrc.json   # React + hooks (new)
└── .markdownlint.json        # Markdown rules (future)
```

## Best Practices

### 1. Don't Disable Rules Globally
```typescript
// Bad
/* eslint-disable @typescript-eslint/no-explicit-any */

// Good - narrow scope, explain why
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Theia API requires any here
const untypedValue: any = theiaService.getValue();
```

### 2. Fix Warnings Incrementally
- Warnings are future errors
- Address before shipping features
- Don't let warning count grow

### 3. Security Rules Are Sacred
Never disable:
- `no-unsanitized/*`
- `no-eval`
- `react/no-danger`

If you must, document WHY with code review.

### 4. Prettier Always Wins
If Prettier and ESLint conflict, configure ESLint to match Prettier, not vice versa.

### 5. Test Custom Rules
When writing Quallaa-specific rules:
- Write tests for the rule
- Run on existing codebase
- Tune to minimize false positives

## Philosophy

**Inherited from Theia:**
- Pragmatic over dogmatic
- Security first
- TypeScript strict mode
- Warnings are future errors

**Added for Quallaa:**
- Consistency through automation (Prettier)
- Dogfooding our markdown features
- Accessibility is not optional
- Knowledge-first = markdown-first linting

## Related Documents

- [[Architecture Decisions]] - Why we chose certain patterns
- [[Git Workflow Strategies]] - How linting integrates with git
- [[Product Branding and UI Text]] - Linting UI text consistency
- [[Decisions Summary]] - High-level technical decisions

---

**Status:** Phase 1 complete (Prettier, React Hooks, lint-staged). Phase 2 pending (markdown, a11y).
