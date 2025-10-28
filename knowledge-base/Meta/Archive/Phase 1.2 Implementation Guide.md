# Phase 1.2 Implementation Guide - Basic Wiki Links

**Status:** Ready to implement **Last Updated:** 2025-10-27

## Overview

Phase 1.2 implements basic wiki link functionality: parsing, autocomplete,
navigation, and broken link detection. All four components ship together as a
complete unit for daily use.

## Foam Modules to Extract

Based on research into the Foam project (foambubble/foam), here are the key
modules and algorithms to study and adapt:

### Core Packages

The Foam monorepo contains:

- `packages/foam-core/` - Platform-agnostic knowledge management logic
- `packages/foam-vscode/` - VSCode-specific integration

### Key Modules to Extract

**1. Wiki Link Parsing** (`foam-core/src/markdown-provider.ts`)

- Uses `wikiLinkPlugin` as a ParserPlugin
- Regex pattern: `/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g`
- Handles piped wikilinks: `[[target|display text]]`
- Case-insensitive matching

**2. Note Graph** (`foam-core/src/note-graph.ts`)

- Graph data structure with nodes (notes) and edges (links)
- Slug querying for resolving wikilinks to files
- Bidirectional link tracking

**3. Link Resolution**

- Strips markdown extensions (.md, .markdown, .mdx, .mdown, etc.)
- Normalizes case for matching
- **Important assumption:** Foam assumes no duplicate filenames

**4. Placeholder Detection**

- Identifies broken/unresolved wikilinks
- Styles them differently in UI
- Tracks them for "create on click" functionality

**5. Metadata Extraction**

- Frontmatter parsing (YAML)
- Title extraction from filename or frontmatter
- Alias handling

### Third-Party Dependencies Used by Foam

- **remark-wiki-link** - Remark plugin for parsing wikilink syntax
- Uses remark/unified ecosystem for markdown processing

### What NOT to Extract

- Link Reference Definitions generation (Foam-specific for GitHub compatibility)
- VSCode-specific tree view implementations
- Foam's single-icon activity bar approach

## Obsidian UX Patterns to Match

### Autocomplete Behavior

**Trigger:**

- Type `[[` anywhere in the editor
- Autocomplete menu appears immediately

**Suggestions:**

- Show all markdown files in the workspace
- Fuzzy search as user types
- Display: filename (without .md extension)
- Group by folder if needed for disambiguation
- Show aliases from frontmatter

**Selection:**

- Arrow keys to navigate
- Enter/Tab to accept
- Automatically completes to `[[FileName]]` with cursor after `]]`
- Continue typing to filter results in real-time

**Special Characters:**

- `#` - After file selection, triggers heading autocomplete
- `^` - After file selection, triggers block reference autocomplete
- `|` - After file selection, allows entering display text

**Implementation Notes:**

- Monaco CompletionItemProvider triggered on `[[`
- Show full file list initially
- Filter client-side as user types
- No "Create new note" option in autocomplete (that's Quick Switcher's job)

### Link Navigation

**Click Behavior:**

- Simple click: No action (keeps editing)
- Cmd+Click (Mac) / Ctrl+Click (Win): Follow link, open in same pane
- Cmd+Shift+Click: Follow link, open in new split pane

**Hover Behavior:**

- Hover alone: Shows URL/file path in tooltip (standard Monaco)
- Cmd+Hover: Shows page preview popup with first ~200 words
- Can click links within preview popup

**Implementation Notes:**

- Use Monaco's built-in link detection
- Register DefinitionProvider to resolve `[[wikilink]]` to file URI
- Register HoverProvider for Cmd+Hover preview (Phase 2+, not MVP)
- Simple Cmd+Click navigation for Phase 1.2

### File Creation from Broken Links

**Broken Link Styling:**

- Different color (e.g., purple/pink vs blue for working links)
- Still looks clickable
- No warning icon (too cluttered)

**Click on Broken Link:**

- Cmd+Click on broken link
- Immediately creates file (no confirmation dialog)
- Opens file in editor
- Cursor placed in empty file, ready to type

**File Creation Location:**

- **Default folder** - See "Default KB Folder" section below
- If wikilink contains path like `[[Folder/Note]]`, respect the path
- If current note is in a subfolder and link is simple like `[[Note]]`, use
  default folder (not same folder as current note)

**Implementation Notes:**

- LinkProvider returns `file://` URI even if file doesn't exist
- Before opening, check if file exists
- If not, create empty file at resolved path
- Then open in editor

### Default KB Folder Setting

**Obsidian's Approach:**

- Setting: "Files & Links" → "Default location for new notes"
- Options:
    - Vault root (default)
    - Specific folder (user chooses)
    - Same folder as current file

**Our Approach:**

**Setting Location:** Preferences → Knowledge Base → Default location for new
notes

**Options:**

1. **Workspace root** (default for MVP)
2. **Specific folder** (Phase 2+)
3. **Same folder as current file** (Phase 2+)

**Git Project Considerations:**

- "Workspace root" = The root of the opened workspace folder
- Typically this is the git repository root
- No concept of "vault" - user can open any folder/git repo
- Multiple workspace folders: Use root of first workspace folder for MVP

**Implementation:**

- Store in workspace settings (.theia/settings.json)
- Preference key: `knowledgeBase.defaultNoteLocation`
- Default value: workspace root
- Use this setting when creating new notes via:
    - Broken wikilink clicks
    - Quick Switcher (Phase 2+)
    - Daily Notes (Phase 6+)

## Indexing Architecture Decision

### The Question

Should Phase 1.3 (Note Indexing Service) be built BEFORE Phase 1.2?

Wiki link autocomplete needs to suggest files. There are three approaches:

### Option A: Build Index First (1.3 → 1.2)

**Approach:**

1. Build note indexing service with file watching
2. Then implement wiki links with autocomplete using the index

**Pros:**

- Autocomplete is fast from day one
- Proper architecture from the start
- No throwaway code

**Cons:**

- Delays shipping any visible features
- More complex first step
- Testing autocomplete requires building index first

### Option B: Simple Scan First (1.2 → 1.3)

**Approach:**

1. Implement autocomplete with simple file scan (Glob for \*.md)
2. Ship Phase 1.2 with basic but working autocomplete
3. Build proper indexing service in Phase 1.3
4. Replace simple scan with index lookup

**Pros:**

- Ship visible features faster
- Simpler first implementation
- Can test autocomplete independently
- Iterative improvement

**Cons:**

- Some throwaway code
- Autocomplete may be slower initially
- Refactoring needed in Phase 1.3

### Option C: Build Together (1.2 + 1.3 Combined)

**Approach:**

1. Build both phases as one large implementation
2. Ship complete solution with indexing + autocomplete

**Pros:**

- No throwaway code
- Proper architecture from the start
- One refactoring

**Cons:**

- Longer time to first ship
- Larger scope makes testing harder
- More complex debugging

### Recommendation: Option B (Simple Scan First)

**Rationale:**

1. **Faster Feedback Loop**
    - See wiki links working in days, not weeks
    - Can test autocomplete UX before building complex backend

2. **Lower Risk**
    - Smaller independent components
    - Easier to debug
    - Can adjust UX before committing to indexing architecture

3. **Progressive Enhancement**
    - Phase 1.2 works (even if slower)
    - Phase 1.3 makes it better
    - Classic iterative development

4. **Minimal Waste**
    - The "throwaway" is just one function: `getAllMarkdownFiles()`
    - Everything else (completion provider, navigation, UI) stays the same
    - ~20 lines of code to replace

**Implementation for Phase 1.2:**

```typescript
// Simple implementation for Phase 1.2
async getAllMarkdownFiles(): Promise<URI[]> {
    // Use Theia FileService to glob for *.md files
    const files = await this.fileService.glob('**/*.md');
    return files;
}

// Phase 1.3 replacement (same interface)
async getAllMarkdownFiles(): Promise<URI[]> {
    // Use index instead of glob
    return this.noteIndexService.getAllNoteUris();
}
```

**Performance Expectations:**

- For 100-1000 notes: Glob is fast enough (&lt;100ms)
- For 1000+ notes: Phase 1.3 indexing becomes important
- MVP users likely have &lt;1000 notes

## Phase 1.2 Implementation Checklist

### 1. Wiki Link Parser

- [ ] Create `WikiLinkParser` service
- [ ] Regex: `/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g`
- [ ] Extract target and optional display text
- [ ] Handle section links: `[[Note#Section]]`
- [ ] Case-insensitive matching
- [ ] Strip .md extension if present

### 2. File Resolution Service

- [ ] Create `WikiLinkResolver` service
- [ ] Input: wiki link target (string)
- [ ] Output: URI or undefined
- [ ] Use simple glob for `*.md` files (Phase 1.2 approach)
- [ ] Match logic:
    - Exact filename match (case-insensitive)
    - Normalize spaces/-/\_ as equivalent
    - Check frontmatter aliases (Phase 2+)
    - Return most recently modified if ambiguous
- [ ] Handle broken links (return undefined)

### 3. Monaco Completion Provider

- [ ] Register `CompletionItemProvider` for markdown files
- [ ] Trigger on `[[` character sequence
- [ ] Get all markdown files via resolver
- [ ] Create CompletionItem for each file
    - Label: filename without extension
    - Insert text: filename
    - Detail: relative path if in subfolder
- [ ] Filter client-side as user types
- [ ] Cursor position: after closing `]]`

### 4. Link Navigation

- [ ] Register `DefinitionProvider` for markdown files
- [ ] Detect `[[wikilink]]` at cursor position
- [ ] Parse wiki link to extract target
- [ ] Resolve to file URI
- [ ] Return Location for Monaco to handle Cmd+Click
- [ ] If file doesn't exist:
    - Resolve where it WOULD be created
    - Create empty file at that path
    - Return Location to open it

### 5. Broken Link Detection

- [ ] Register `DiagnosticProvider` for markdown files (or custom decorator)
- [ ] Parse all wiki links in document
- [ ] For each link, try to resolve
- [ ] If resolution fails, mark as broken
- [ ] Apply different styling (color/underline)
- [ ] Show hover tooltip: "Click to create Note.md"

### 6. Settings

- [ ] Add preference: `knowledgeBase.defaultNoteLocation`
- [ ] Default value: workspace root
- [ ] Use in file creation logic
- [ ] Document in settings schema

### 7. Testing

- [ ] Unit tests for WikiLinkParser
- [ ] Unit tests for WikiLinkResolver
- [ ] Integration test: type `[[` → see suggestions
- [ ] Integration test: Cmd+Click working link → opens file
- [ ] Integration test: Cmd+Click broken link → creates file
- [ ] Manual testing: use daily for note-taking

## Done Definition

Phase 1.2 is complete when:

1. ✅ All checklist items implemented
2. ✅ Unit tests pass
3. ✅ Integration tests pass
4. ✅ Manual testing in real usage scenario
5. ✅ You can use it daily for note-taking
6. ✅ No critical bugs in basic workflows
7. ✅ Code reviewed (self-review acceptable for solo dev)

**Not required for "done":**

- Performance optimization (that's Phase 1.3)
- Hover previews (that's Phase 2+)
- Alias support (that's Phase 2+)
- Edge case handling (handle during Phase 1.3)

## Success Metrics (Qualitative for MVP)

- "Autocomplete feels responsive" (subjective, no hard target)
- "Cmd+Click navigation feels instant"
- "I can take notes without friction"

**No specific performance targets at this time.**

## Related Documents

- [[Next Steps]] - Full roadmap
- [[Wiki Links]] - Feature specification
- [[Foam Project Analysis]] - Reference implementation
- [[Obsidian Feature Comparison]] - UX patterns
- [[Theia File Service]] - File operations API
- [[Extension Structure Decision]] - Code organization

## Questions Resolved

1. ✅ Ship all Phase 1.2 features together
2. ✅ Extract algorithms from Foam (specific modules identified)
3. ✅ Match Obsidian autocomplete UX
4. ✅ Match Obsidian link navigation (Cmd+Click)
5. ✅ Use simple file scan first, proper index in Phase 1.3
6. ✅ Use Theia FileService events for file watching
7. ✅ Primary user journey: "Type `[[`, see files, select, Cmd+Click to
   navigate"
8. ✅ Default KB folder: workspace root initially, setting for customization
9. ✅ Git project = workspace folder (no special git requirements)
10. ✅ Single workspace support for MVP
11. ✅ Done = fully implemented and usable daily
12. ✅ No specific performance targets yet

## Additional Implementation Decisions (2025-10-27)

### Parsing Strategy

**Decision:** Use regex extraction, not remark-wiki-link dependency
**Rationale:** More control, simpler for Phase 1.2, can add remark later if
needed for advanced features

### Autocomplete Filtering

**Decision:** Client-side filtering (Monaco handles it) **Rationale:** Simpler
implementation, Monaco already has excellent fuzzy matching

### Broken Link Detection Timing

**Decision:** On document open initially, add real-time in Phase 2
**Rationale:** Simpler first implementation, good enough for daily use

### Ambiguous Link Handling

**Decision:** Show both options with folder paths in autocomplete **Rationale:**
Clear disambiguation, user can see both options

### Test Strategy

**Decision:** Unit tests for Phase 1.2, integration tests in Phase 1.3

- Create test workspace with sample notes for manual testing
- Use personal notes for dogfooding
- Unit tests for parser and resolver

## Open Questions

None remaining for Phase 1.2 implementation. Ready to begin!

---

**Next Action:** Begin implementation with WikiLinkParser service.
