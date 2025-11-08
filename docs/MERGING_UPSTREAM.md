# Merging Upstream Theia Updates

This document explains how to merge updates from the upstream Eclipse Theia IDE
repository into the Quallaa fork.

## Quick Start

The easiest way to merge upstream changes is using the automated merge script:

```bash
.github/scripts/merge-upstream.sh
```

This script will:

- Fetch the latest upstream changes
- Automatically resolve known conflicts
- Regenerate `yarn.lock`
- Show you which files still need manual resolution

## Understanding the Fork Structure

Quallaa is a **fork** of Eclipse Theia IDE, not an extension. This means:

- We modify Theia's core files for branding and product identity
- We add new extensions (like `knowledge-base`) that don't exist upstream
- We customize the user experience, documentation, and default settings

### Files That Will NEVER Conflict

These are Quallaa-specific additions with no upstream equivalent:

- `theia-extensions/knowledge-base/` - Entire extension (28 files)
- All logo and icon files in `logo/` and product icons
- Test workspace files in `test-workspace/`
- E2E tests in `applications/browser/test/`
- Playwright configuration
- `.husky/` git hooks
- `.prettierrc.json`, `.markdownlint.json`, `.lintstagedrc.json`

**Action:** No conflicts, no action needed ✅

### Files That Will ALWAYS Conflict

These files are heavily modified for Quallaa and will conflict on every merge:

#### 1. **Documentation Files**

**Files:**

- `README.md`
- `CONTRIBUTING.md`
- `LICENSE` (copyright line)
- `NOTICE.md`

**Strategy:** Always keep ours

```bash
git checkout --ours README.md CONTRIBUTING.md NOTICE.md
git add README.md CONTRIBUTING.md NOTICE.md
```

**Why:** These are completely rewritten for Quallaa branding and vision.

---

#### 2. **Product Extension Files**

**Files:**

- `theia-extensions/product/src/browser/branding-util.tsx`
- `theia-extensions/product/src/browser/theia-ide-about-dialog.tsx`
- `theia-extensions/product/src/browser/theia-ide-getting-started-widget.tsx`
- `theia-extensions/product/src/browser/style/index.css`

**Strategy:** Always keep ours

```bash
git checkout --ours theia-extensions/product/src/browser/*.tsx
git checkout --ours theia-extensions/product/src/browser/style/index.css
git add theia-extensions/product/src/browser/
```

**Why:** These define the entire Quallaa user experience, welcome screens, and
help text.

---

#### 3. **yarn.lock**

**File:** `yarn.lock`

**Strategy:** Always regenerate

```bash
git checkout --theirs yarn.lock
yarn install
git add yarn.lock
```

**Why:**

- Quallaa has 1,415 lines of additional dependencies (D3.js, Playwright, etc.)
- Upstream updates their dependencies regularly
- The only reliable approach is to regenerate the entire lock file

**Important:** After regenerating, verify your Quallaa-specific dependencies are
still present:

```bash
yarn list --pattern "d3|gray-matter|@playwright"
```

---

#### 4. **Application package.json Files**

**Files:**

- `package.json` (root)
- `applications/browser/package.json`
- `applications/electron/package.json`
- `theia-extensions/product/package.json`
- `theia-extensions/launcher/package.json`
- `theia-extensions/updater/package.json`

**Strategy:** Manual merge required

**What to keep (ours):**

```json
{
    "name": "quallaa-*", // Keep ours
    "description": "Quallaa - ...", // Keep ours
    "productName": "Quallaa", // Keep ours
    "license": "EPL-2.0", // Keep ours
    "author": "Jeff Toffoli", // Keep ours
    "homepage": "https://github.com/jefftoffoli/Quallaa-app#readme", // Keep ours
    "bugs": { "url": "https://github.com/jefftoffoli/Quallaa-app/issues" }, // Keep ours
    "repository": {
        "url": "git+https://github.com/jefftoffoli/Quallaa-app.git"
    } // Keep ours
}
```

**What to accept (theirs):**

```json
{
    "version": "1.xx.xxx", // Accept theirs (version bump)
    "dependencies": {
        "@theia/core": "1.xx.x", // Accept theirs (updated versions)
        "@theia/filesystem": "1.xx.x" // Accept theirs
        // ... all @theia/* dependencies
    },
    "devDependencies": {
        "@theia/cli": "1.xx.x" // Accept theirs
        // ... etc
    }
}
```

**What to keep AND add:**

```json
{
    "dependencies": {
        // Accept all upstream @theia/* updates
        "@theia/core": "1.xx.x",
        // ...
        // PLUS add our custom extensions:
        "quallaa-knowledge-base-ext": "1.65.100", // Keep ours
        "quallaa-product-ext": "1.65.100" // Keep ours
    },
    "theia": {
        "frontend": {
            "config": {
                "applicationName": "Quallaa", // Keep ours
                "configurationFolder": ".quallaa" // Keep ours
            }
        }
    }
}
```

**Merge Process:**

1. Open the conflicted file in your editor
2. For metadata fields (name, author, homepage, etc.): keep ours
3. For dependency versions: accept theirs
4. For custom dependencies (quallaa-\*): keep ours
5. For version field: accept theirs
6. For configuration: keep ours

---

### Files That Will SOMETIMES Conflict

These files occasionally have conflicts depending on what changed upstream:

#### 5. **ESLint Configuration**

**File:** `.eslintrc.js`

**What we added:**

```javascript
extends: [
    // ... upstream configs
    './configs/react.eslintrc.json',         // Ours
    './configs/accessibility.eslintrc.json'  // Ours
],
```

**Strategy:** Keep both

- Accept upstream changes to existing configs
- Keep our additional extends
- Merge any new ignorePatterns

---

#### 6. **gitignore**

**File:** `.gitignore`

**What we added:**

```gitignore
# Private planning and strategy docs
knowledge-base/

# Playwright test artifacts
test-results/
playwright-report/
test-*.png

# Development debug scripts
debug-*.js
test-graph-*.js
```

**Strategy:** Keep both

- Accept upstream additions
- Keep our additions
- Remove duplicates

---

#### 7. **Electron Builder Config**

**File:** `applications/electron/electron-builder.yml`

**What we changed:**

```yaml
productName: Quallaa # Keep ours
appId: com.quallaa.ide # Keep ours
# ... icons and branding
```

**Strategy:**

- Keep product name, app ID, and branding
- Accept upstream build configuration changes
- Manually merge if both changed the same section

---

## Step-by-Step Merge Process

### 1. Prepare Your Environment

Ensure your working directory is clean:

```bash
git status
# Should show: "nothing to commit, working tree clean"
```

If you have uncommitted changes:

```bash
git stash
# or
git commit -am "WIP: saving before upstream merge"
```

### 2. Fetch Upstream Changes

```bash
git fetch upstream
```

View what's changed:

```bash
git log --oneline HEAD..upstream/master | head -20
```

### 3. Run the Automated Merge Script

```bash
.github/scripts/merge-upstream.sh
```

The script will:

1. ✅ Fetch latest upstream
2. ✅ Start the merge
3. ✅ Auto-resolve documentation files (keep ours)
4. ✅ Auto-resolve branding files (keep ours)
5. ✅ Regenerate yarn.lock
6. ⚠️ Show remaining conflicts (usually package.json files)

### 4. Resolve Remaining Conflicts

Check which files still have conflicts:

```bash
git status
```

For each conflicted file:

```bash
# Open in your editor
code <filename>

# Look for conflict markers:
<<<<<<< HEAD
# Your changes
=======
# Upstream changes
>>>>>>> upstream/master
```

Apply the strategies from the sections above.

### 5. Verify the Merge

After resolving all conflicts:

```bash
# Stage resolved files
git add <files>

# Check nothing is missing
git status

# Verify Quallaa dependencies are intact
yarn install
yarn build:dev
```

**Critical checks:**

- [ ] Knowledge base extension still builds
- [ ] Package names are still `quallaa-*`
- [ ] Branding shows "Quallaa" not "Theia"
- [ ] D3.js and other custom deps are in yarn.lock

### 6. Test Before Committing

Run a quick smoke test:

```bash
cd applications/browser
yarn start
```

Open http://localhost:3000 and verify:

- [ ] App title is "Quallaa"
- [ ] Logo is Quallaa logo
- [ ] Help > About shows Quallaa
- [ ] Wiki links work (test with test-workspace)
- [ ] Knowledge graph opens
- [ ] Backlinks panel works

Run E2E tests:

```bash
yarn test
```

### 7. Commit the Merge

```bash
git commit -m "Merge upstream Theia updates

Merged upstream/master (commit: <upstream-commit-hash>)

Updated dependencies:
- Theia core packages: 1.XX.X -> 1.YY.Y
- [other notable updates]

Conflict resolution:
- Kept Quallaa branding and metadata
- Accepted upstream dependency updates
- Regenerated yarn.lock
- Maintained knowledge-base extension compatibility

Tested:
- Build successful
- Knowledge base features working
- E2E tests passing
"
```

### 8. Post-Merge Cleanup

```bash
# Clean build artifacts
yarn clean

# Fresh install
yarn install

# Full rebuild
yarn build

# Run full test suite
yarn test

# If everything passes:
git push origin master
```

---

## Common Conflicts and Solutions

### Conflict: "Both modified package.json"

**Example:**

```json
<<<<<<< HEAD
  "name": "quallaa-browser-app",
  "productName": "Quallaa",
  "license": "EPL-2.0",
  "version": "1.65.100",
=======
  "name": "theia-ide-browser-app",
  "productName": "Theia IDE",
  "license": "MIT",
  "version": "1.66.100",
>>>>>>> upstream/master
```

**Resolution:**

```json
  "name": "quallaa-browser-app",          // Keep ours
  "productName": "Quallaa",               // Keep ours
  "license": "EPL-2.0",                   // Keep ours
  "version": "1.66.100",                  // Accept theirs (version bump)
```

### Conflict: "Dependency version mismatch"

**Example:**

```json
<<<<<<< HEAD
    "@theia/core": "1.65.1",
=======
    "@theia/core": "1.66.1",
>>>>>>> upstream/master
```

**Resolution:**

```json
    "@theia/core": "1.66.1",  // Always accept upstream version
```

### Conflict: "Custom extension not in upstream"

**Example:**

```json
<<<<<<< HEAD
    "quallaa-knowledge-base-ext": "1.65.100",
=======
    // (nothing - doesn't exist upstream)
>>>>>>> upstream/master
```

**Resolution:**

```json
    "quallaa-knowledge-base-ext": "1.65.100",  // Keep ours
```

---

## Troubleshooting

### Build Fails After Merge

**Symptom:** `yarn build` fails with errors

**Solutions:**

1. Clean and reinstall:

    ```bash
    yarn clean
    rm -rf node_modules
    yarn install
    yarn build:dev
    ```

2. Check for missing dependencies:

    ```bash
    yarn list --pattern "@theia"
    ```

3. Verify knowledge-base extension dependencies:
    ```bash
    cd theia-extensions/knowledge-base
    yarn install
    yarn build
    ```

### Knowledge Base Features Broken

**Symptom:** Wiki links or graph not working after merge

**Solutions:**

1. Check extension is registered:

    ```bash
    grep "quallaa-knowledge-base-ext" applications/browser/package.json
    ```

2. Rebuild the extension:

    ```bash
    cd theia-extensions/knowledge-base
    yarn clean && yarn build
    cd ../..
    yarn build:applications:dev
    ```

3. Check browser console for errors when running the app

### Tests Fail After Merge

**Symptom:** E2E tests failing

**Solutions:**

1. Update test snapshots if needed:

    ```bash
    cd applications/browser
    yarn test --update-snapshots
    ```

2. Check if upstream changed Theia APIs:

    ```bash
    git log upstream/master --grep="BREAKING" | head -20
    ```

3. Review test-workspace is still valid:
    ```bash
    ls -la test-workspace/
    ```

### Merge Created Duplicate Dependencies

**Symptom:** `yarn install` shows warnings about duplicate packages

**Solution:**

```bash
yarn dedupe
git add yarn.lock
```

---

## Merge Checklist

Use this checklist for every upstream merge:

- [ ] Working directory is clean
- [ ] Fetched latest upstream: `git fetch upstream`
- [ ] Reviewed upstream changes: `git log HEAD..upstream/master`
- [ ] Run merge script: `.github/scripts/merge-upstream.sh`
- [ ] Resolved all conflicts using documented strategies
- [ ] Verified package.json metadata is still Quallaa
- [ ] Regenerated yarn.lock: `yarn install`
- [ ] Clean build successful: `yarn clean && yarn build:dev`
- [ ] Quallaa branding intact (name, logo, help text)
- [ ] Knowledge base extension builds
- [ ] Browser app starts and shows Quallaa branding
- [ ] Wiki links work in test-workspace
- [ ] Knowledge graph opens and visualizes notes
- [ ] Backlinks panel shows incoming links
- [ ] E2E tests pass: `yarn test`
- [ ] Committed with descriptive message
- [ ] Pushed to origin

---

## Merge Frequency

**Recommended:** Merge upstream changes **monthly**

**Why:**

- Theia releases updates approximately monthly
- Smaller, frequent merges are easier than large, infrequent ones
- Keeps Quallaa up-to-date with security fixes
- Reduces risk of drift from upstream

**Track upstream releases:**

- Watch: https://github.com/eclipse-theia/theia-ide/releases
- Subscribe to Theia mailing list:
  https://accounts.eclipse.org/mailing-list/theia-dev

---

## Emergency: Aborting a Merge

If things go wrong and you need to abort:

```bash
git merge --abort
```

This will return your repository to the state before the merge started.

**Note:** This only works if you haven't committed yet. If you've already
committed and pushed, you'll need to revert:

```bash
git revert -m 1 HEAD
git push origin master
```

---

## Getting Help

If you encounter a difficult merge:

1. **Check Theia IDE changelog:**
    - https://github.com/eclipse-theia/theia-ide/blob/master/CHANGELOG.md
    - Look for BREAKING CHANGES

2. **Review Theia migration guides:**
    - https://github.com/eclipse-theia/theia/tree/master/doc/Migration.md

3. **Ask in Theia community:**
    - Discussions: https://github.com/eclipse-theia/theia/discussions
    - Spectrum chat: https://spectrum.chat/theia

4. **Document the issue:**
    - Create an issue in Quallaa repo
    - Tag it with `upstream-merge`
    - Share your resolution for future reference

---

## Automation Ideas (Future)

Consider automating the merge process:

1. **GitHub Action** that:
    - Runs weekly/monthly
    - Fetches upstream
    - Creates a PR with automated conflict resolution
    - Runs tests
    - Notifies if manual intervention needed

2. **Pre-commit hook** that:
    - Verifies Quallaa branding is intact
    - Checks knowledge-base extension is registered
    - Validates package names

3. **Post-merge script** that:
    - Runs full test suite
    - Generates changelog
    - Updates version numbers

---

## Version Compatibility Matrix

Track which Quallaa version is based on which Theia version:

| Quallaa Version | Theia Version | Merge Date | Notes            |
| --------------- | ------------- | ---------- | ---------------- |
| 1.65.100        | 1.65.1        | 2024-XX-XX | Initial fork     |
| (next)          | 1.66.1        | TBD        | Current upstream |

Update this table after each successful merge.
