# Phase 1.3 Status Report - File Watching Investigation

**Date:** 2025-10-29
**Status:** ✅ CORE FEATURES WORKING | ⚠️ FILE WATCHER NOT DETECTING NEW FILES

## Executive Summary

Phase 1.3 implementation is **functionally complete** for its core features:
- ✅ Initial workspace indexing works correctly
- ✅ Frontmatter parsing works (title, aliases, tags)
- ✅ Wiki link autocomplete works
- ✅ Wiki link resolution works (including aliases)
- ⚠️ **File watcher not detecting new files** created after initial indexing

## What We've Built (Last 2 Days)

### Commit History
```
30036d2 - feat: implement Phase 1.3 note indexing service (Oct 29, 07:49)
9d22861 - feat: improve wiki links workspace detection (Oct 29)
8d9bd3d - docs: add comprehensive image handling strategy (Oct 29)
2bc38c8 - test: add initial wiki links E2E tests (Oct 29)
6a1ab3f - test: add Playwright E2E testing infrastructure (Oct 29)
```

### Core Components

#### 1. **Backend Indexing Service**
**File:** `theia-extensions/knowledge-base/src/node/knowledge-base-service-impl.ts`

**Architecture:**
```typescript
class KnowledgeBaseServiceImpl {
    // Three-tier index for O(1) lookups
    private noteIndex: Map<string, Note>;           // URI → Note
    private titleIndex: Map<string, string[]>;      // normalized title → URIs[]
    private aliasIndex: Map<string, string[]>;      // normalized alias → URIs[]

    private workspaceRoot: URI;
    private watcher: chokidar.FSWatcher;            // File watcher instance
}
```

**Key Methods:**
- `indexWorkspace(workspaceRoot)` - Called by frontend to trigger indexing
- `performIndexing()` - Scans workspace for .md files, indexes them
- `indexFile(filePath)` - Indexes a single file with frontmatter parsing
- `startFileWatching()` - Initializes chokidar file watcher
- `searchNotes(query)` - Fuzzy search for autocomplete
- `resolveWikiLink(target)` - Resolves wiki link to Note

**Indexing Process:**
1. Frontend calls `indexWorkspace()` with workspace URI
2. Backend scans recursively for `**/*.md` files
3. Each file is indexed with frontmatter parsing
4. Three indices are built (note, title, alias)
5. File watcher starts monitoring the workspace

#### 2. **Frontend Workspace Detection**
**File:** `theia-extensions/knowledge-base/src/browser/knowledge-base-workspace-contribution.ts`

**Purpose:** Get workspace root from Theia's WorkspaceService and notify backend

**Lifecycle:**
```typescript
onStart() {
    // Wait for workspace to be loaded
    when workspace ready:
        - Get workspace root from WorkspaceService
        - Call backend.indexWorkspace(workspaceRoot)
        - Listen for workspace changes
}
```

This solved the previous issue where backend was guessing workspace from file URIs.

#### 3. **Frontmatter Parser**
**File:** `theia-extensions/knowledge-base/src/node/frontmatter-parser.ts`

**Uses:** `gray-matter` library

**Capabilities:**
- Extracts YAML frontmatter from markdown
- Parses `title`, `aliases`, `tags`
- Normalizes aliases/tags to arrays
- Falls back to filename if no title
- Extracts inline `#tags` from content

**Example:**
```markdown
---
title: TestC Frontmatter
aliases: [testC, tC]
tags: [test, demo]
---
```

#### 4. **File Watching**
**File:** Same as indexing service

**Implementation:**
```typescript
this.watcher = chokidar.watch('**/*.md', {
    cwd: workspaceRoot,
    ignoreInitial: true,  // Don't fire for initial files
    ignored: ['**/node_modules/**', '**/.git/**', '**/.*'],
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
    },
});

this.watcher.on('add', async filePath => {
    console.log('[KnowledgeBase] File added:', filePath);
    await this.indexFile(fullPath);
});

this.watcher.on('change', async filePath => {
    console.log('[KnowledgeBase] File changed:', filePath);
    this.removeFromIndex(uri);
    await this.indexFile(fullPath);
});

this.watcher.on('unlink', filePath => {
    console.log('[KnowledgeBase] File deleted:', filePath);
    this.removeFromIndex(uri);
});
```

## Current Test Results (Oct 29, 2:08 PM)

### Successful Tests ✅

**1. Initial Workspace Indexing**
```
[KnowledgeBase] Indexing workspace: file:///.../test-workspace
[KnowledgeBase] Indexed 11 files in 7ms
[KnowledgeBase] noteIndex size: 11
[KnowledgeBase] titleIndex size: 15
[KnowledgeBase] aliasIndex size: 4
```

**Indexed Files:**
- Broken Link, Index, Meeting Notes, Project Ideas, Wiki Links
- foo (title: "My Custom Title", aliases: [Alt Name, Another Name])
- Nested Note, bar (same aliases as foo)
- testA (title: "My Custom TestA", same aliases)
- testB, **testC (title: "TestC Frontmatter", aliases: [testC, tC])**

**2. Frontmatter Parsing ✅**
testC.md correctly parsed:
- Title: "TestC Frontmatter" (from frontmatter, not filename)
- Aliases: ["testC", "tC"]
- Both title and aliases added to respective indices

**3. Wiki Link Autocomplete ✅**
```
searchNotes called with query: ""
searchNotes returning 11 results for "":
  ['Meeting Notes', 'TestC Frontmatter', 'testB', 'My Custom TestA', ...]
```

When typing `[[test`, autocomplete shows:
- testB
- TestC Frontmatter
- My Custom Test (foo's title)
- My Custom TestA

**4. Alias Resolution ✅**
```
[WikiLinkDetector] Link TestC Frontmatter resolved: true
```

Links to testC via its frontmatter title work correctly.

### Failed Test ⚠️

**File Watcher Not Detecting New Files**

**Test:** Created testD.md after server started
**Expected:**
```
[KnowledgeBase] File added: testD.md
[KnowledgeBase] Indexed 12 files
```

**Actual:** No logs, testD not indexed

**Evidence:**
```bash
$ find test-workspace -name "*.md" -type f | wc -l
12  # testD exists on filesystem

$ grep -i "testD" backend_logs
# No results - file never detected by watcher
```

**File Watcher Confirmed Started:**
```
[KnowledgeBase] Starting file watcher on: /Users/.../test-workspace
```

## Root Cause Analysis

### What We Know

1. **Chokidar watcher starts successfully** - logs confirm initialization
2. **Initial indexing works** - all existing files indexed
3. **File creation happens** - testD.md exists on filesystem with timestamp after server start
4. **No 'add' event fires** - no "[KnowledgeBase] File added:" log appears
5. **No error events** - no "[KnowledgeBase] File watcher error:" logs

### Possible Causes

#### 1. **Chokidar Configuration Issue** ⭐ MOST LIKELY
The `ignoreInitial: true` option prevents firing events for existing files, but there might be an issue with:
- The `cwd` option combined with the glob pattern
- Chokidar not detecting filesystem events on macOS (fsevents)
- Timing issue - files created too quickly after watcher starts

**Test:** Add `ready` event logging
```typescript
this.watcher.on('ready', () => {
    console.log('[KnowledgeBase] File watcher ready');
});
```

#### 2. **macOS Specific Issue**
macOS uses FSEvents for file watching, which can have:
- Permission issues
- Delays in event propagation
- Issues with certain directory structures

**Test:** Try `usePolling: true` option

#### 3. **Glob Pattern Issue**
Pattern `**/*.md` with `cwd` might not match:
- Need to verify chokidar is actually watching the directory
- Try absolute paths instead of relative

**Test:** Add `all` event logging
```typescript
this.watcher.on('all', (event, path) => {
    console.log('[KnowledgeBase] Watcher event:', event, path);
});
```

#### 4. **Async/Timing Issue**
The watcher might not be fully initialized before files are created:
- `startFileWatching()` returns immediately
- Events might be missed in the brief initialization window

**Test:** Wait for 'ready' event before considering watcher active

### Recommended Fix

Add comprehensive logging and event handling:

```typescript
private startFileWatching(): void {
    if (!this.workspaceRoot || this.watcher) {
        return;
    }

    const fsPath = this.workspaceRoot.path.fsPath();
    console.log('[KnowledgeBase] Starting file watcher on:', fsPath);

    this.watcher = chokidar.watch('**/*.md', {
        cwd: fsPath,
        ignoreInitial: true,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.*'],
        persistent: true,
        awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50,
        },
    });

    // NEW: Log when watcher is ready
    this.watcher.on('ready', () => {
        console.log('[KnowledgeBase] ✅ File watcher ready and monitoring');
        console.log('[KnowledgeBase] Watching:', this.watcher.getWatched());
    });

    // NEW: Log all events for debugging
    this.watcher.on('all', (event, filePath) => {
        console.log(`[KnowledgeBase] Event: ${event} - ${filePath}`);
    });

    this.watcher.on('add', async filePath => {
        const fullPath = path.join(fsPath, filePath);
        console.log('[KnowledgeBase] File added:', filePath);
        await this.indexFile(fullPath);
    });

    // ... rest of handlers

    this.watcher.on('error', error => {
        console.error('[KnowledgeBase] File watcher error:', error);
    });
}
```

## Testing Methodology Going Forward

### 1. Automated Test (Recommended)
Created: `applications/browser/test/wiki-link-autocomplete.spec.ts`

**Current Status:** Tests fail because they can't detect `.theia-app-shell`

**Next Steps:**
- Fix test to properly wait for Theia app initialization
- Add test for file watching:
  ```typescript
  test('should detect newly created files', async ({ page }) => {
      // Open app
      // Wait for initial index
      // Create new file via filesystem
      // Wait 500ms
      // Check autocomplete includes new file
  });
  ```

### 2. Manual Test Procedure
1. Start server: `yarn --cwd applications/browser start -- "$(pwd)/test-workspace"`
2. Wait for "[KnowledgeBase] === END INDEX ===" log
3. Check log shows 11 files indexed
4. Create new file: `echo "# New Note" > test-workspace/new-note.md`
5. Check for "[KnowledgeBase] File added: new-note.md" log
6. Open autocomplete, verify new-note appears

## Next Actions

### Immediate (File Watcher Fix)
1. ✅ Revert debug logging changes
2. Add comprehensive watcher event logging
3. Add 'ready' and 'all' event handlers
4. Test file creation manually
5. If still failing, try `usePolling: true`
6. If still failing, try absolute path watching

### Short Term (Testing)
1. Fix Playwright test configuration
2. Add file watcher E2E test
3. Document manual testing procedure
4. Create reproducible test case

### Long Term (Phase 2)
- Backlinks panel (leverages working index)
- Tags browser (leverages working frontmatter parsing)
- Quick switcher (leverages working fuzzy search)

## Key Files Reference

```
theia-extensions/knowledge-base/
├── src/
│   ├── common/
│   │   └── knowledge-base-protocol.ts          # Note interface, RPC protocol
│   ├── browser/
│   │   ├── knowledge-base-frontend-module.ts   # DI container bindings
│   │   ├── knowledge-base-workspace-contribution.ts  # Workspace detection
│   │   └── wiki-links/
│   │       ├── wiki-link-contribution.ts       # Registers Monaco features
│   │       ├── wiki-link-completion-provider.ts # Autocomplete implementation
│   │       ├── wiki-link-detector.ts           # Link decoration
│   │       └── wiki-link-navigator.ts          # Cmd+Click navigation
│   └── node/
│       ├── knowledge-base-service-impl.ts      # ⚠️ INDEXING + FILE WATCHING
│       └── frontmatter-parser.ts               # Frontmatter parsing

test-workspace/                                  # Test files
├── testA.md (frontmatter with aliases)
├── testB.md (empty)
├── testC.md (frontmatter: "TestC Frontmatter", aliases: [testC, tC])
└── ... (11 files total)

applications/browser/test/
└── wiki-link-autocomplete.spec.ts              # Playwright tests (WIP)
```

## Summary

**Working Features:**
- Initial workspace indexing: ✅
- Frontmatter parsing: ✅
- Wiki link autocomplete: ✅
- Alias resolution: ✅
- Note search: ✅

**Broken Feature:**
- File watcher detecting new files: ⚠️

**Focus:** Fix chokidar file watching with better event logging and testing.

---

**Last Updated:** 2025-10-29 14:30
**Next Step:** Add comprehensive logging to file watcher and test manually
