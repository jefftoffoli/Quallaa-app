# Obsidian Feature Comparison

This document captures Obsidian's UX patterns and behaviors that we want to learn from for Quallaa.

**Updated:** 2025-10-27

## Overview

Obsidian is a mature note-taking application with excellent knowledge management UX. While we're not aiming for compatibility, we should adopt their best patterns where they align with our knowledge-first IDE vision.

## Wiki Links

### Resolution Strategy: "Shortest Path When Possible"

**How it works:**
- `[[Note Name]]` - works if filename is unique
- `[[Folder/Note Name]]` - automatically added when ambiguous
- Autocomplete shows full path when duplicates exist

**Resolution order:**
1. Exact filename match (case-insensitive, ignore `.md`)
2. Normalized match (treat spaces, hyphens, underscores as equivalent)
3. Check frontmatter `aliases` or `title` field
4. If still ambiguous, use most recently modified

**Edge cases:**
- Two files with same name: `[[Projects/Ideas]]` vs `[[Archive/Ideas]]`
- New file with duplicate name created after link: Simple link may now point to wrong file

**Quallaa adoption:** ✅ Use this exact approach

**Source:** Web research 2025-10-26

---

## Broken Links

### Auto-Create on Click

**Behavior:**
- Clicking broken link immediately creates and opens note
- No confirmation dialog
- Default: Create in same folder as current note
- Setting: Can configure "New note location" preference

**User concerns found:**
- Some users accidentally create notes from typos
- Must use Ctrl+Click vs Click depending on mode (edit vs reading)
- Cannot be disabled in settings (requested feature)

**Quallaa adoption:** ✅ Use auto-create, but make click behavior consistent across modes

**Source:** Obsidian forum discussions, Web research 2025-10-26

---

## Live Preview (WYSIWYG)

### Default Editor Mode

**What it is:**
- "Live Preview" = Obsidian's WYSIWYG editing mode
- Shows formatted markdown while editing
- Markdown syntax appears only around cursor
- Introduced in Obsidian 0.13 (now standard)

**Mode options:**
1. **Source mode** - Raw markdown visible
2. **Live Preview** - WYSIWYG with syntax near cursor
3. **Reading mode** - Pure preview, no editing

**Toggle behavior:**
- Default hotkey: `Cmd+E` (or `Ctrl+E`)
- Can be set globally or per-file
- Each file remembers last mode used

**Settings:**
- `Settings → Editor → Default editing mode`
- Choose: Source mode or Live Preview
- New files open in chosen default

**Quallaa adoption:** ✅ Match this exactly - per-file toggle with global default

**Source:** Obsidian Help docs, Web research 2025-10-26

---

## Graph View

### Node Interaction

**Standard behavior:**
- Click node: Opens note
- Hover: Shows note title
- Drag: Rearrange graph layout
- Scroll: Zoom in/out

**Filters:**
- Filter by tags
- Show/hide orphan nodes
- Depth limit for local graphs
- Search to highlight nodes

**Local vs Global:**
- **Global graph:** All notes in vault
- **Local graph:** Current note + connected notes (configurable depth)

**Quallaa adoption:** ✅ Similar, but add Cmd+Click for split pane and hover preview

---

## Quick Switcher

### Fuzzy Search and Creation

**Behavior:**
- Default hotkey: `Cmd+O` (or `Ctrl+O`)
- Fuzzy search across note titles
- Shows recent files first
- If no match: Enter creates new note with that name

**No explicit "Create note" button** - just type and press Enter

**Quallaa adoption:** ✅ Match exactly

---

## Autocomplete (Detailed)

### Wiki Link Autocomplete Behavior

**Trigger:**
- Type `[[` anywhere in editor
- Autocomplete menu appears immediately
- No additional keystroke needed

**Suggestions Display:**
- Shows all markdown files in vault
- Displays filename without `.md` extension
- Shows folder path if needed for disambiguation
- Real-time filtering as you type

**Selection Actions:**
- Arrow keys to navigate suggestions
- Enter or Tab to accept selection
- Automatically completes to `[[FileName]]`
- Cursor positioned after closing `]]`
- Continue typing filters the list (no need to backspace)

**Special Character Triggers (after file selection):**
- `#` - Triggers heading autocomplete within selected file
- `^` - Triggers block reference autocomplete
- `|` - Allows entering display text (alias)
  - Note: Some users report `Shift+|` requires Tab first (UX friction)

**User-Reported Issues (to avoid):**
- Autocomplete can "prevent" creation of heading links if UX not clear
- Markdown link syntax `[](path)` lacks autocomplete (user request)
- Inconsistent behavior with special characters

**Quallaa adoption:** ✅ Match core behavior, make special characters consistent

**Source:** Obsidian Forum, Web research 2025-10-27

---

## Link Navigation (Detailed)

### Click and Hover Patterns

**Click Behaviors:**
- **Simple click:** No action in Edit mode (keeps editing)
- **Cmd+Click (Mac) / Ctrl+Click (Win):** Follow link in same pane
- **Cmd+Shift+Click:** Follow link in new split pane (user request)

**Hover Behaviors:**
- **Hover alone:** Shows tooltip with file path (minimal)
- **Cmd+Hover (Mac) / Ctrl+Hover (Win):** Page preview popup appears
  - Shows first ~200 words of note
  - Can click links within preview
  - Auto-dismisses when moving away

**Mode Differences:**
- **Edit mode:** Requires Cmd/Ctrl modifier for preview
- **Preview mode:** Some users want preview without modifier
  - This is a user-requested configuration option
  - Prevents "constant popups" while moving mouse

**Reported Bugs/Issues:**
- Preview sometimes "gets stuck" and requires app restart
- Users want option to disable hover preview in edit mode
- Inconsistency between edit/preview mode modifier requirements

**Quallaa adoption:**
✅ Cmd+Click to follow
✅ Cmd+Hover for preview (Phase 2+)
✅ Make behavior consistent across modes
✅ Add setting to disable hover preview

**Source:** Obsidian Forum, Web research 2025-10-27

---

## Default Note Location (Detailed)

### Settings Configuration

**Setting Path:** Settings → Files & Links → Default location for new notes

**Options:**
1. **Vault root** (default)
2. **Same folder as current file**
3. **Specified folder** (user enters path)

**How It Works:**
- Setting applies to ALL new note creation:
  - Quick Switcher
  - Broken wiki link clicks
  - "Create new note" command
- Setting stored per vault
- Can be overridden in specific contexts

**User-Reported Issues:**
- Setting gets "reset" on app restart (bug report)
- Default directory not applied when wikilink includes folder path
  - e.g., `[[Folder/Note]]` creates in Folder/, ignoring setting
- Users want "new note in current folder" to be easier

**Community Plugin:** "Advanced New File" provides more control

**Quallaa adoption:**
✅ Similar setting structure
✅ Default: workspace root
✅ Honor folder paths in wikilinks
✅ Store in workspace settings (.theia/settings.json)

**Source:** Obsidian Forum, Web research 2025-10-27

---

## Backlinks Panel

### Incoming Links Display

**Shows:**
- List of notes that link to current note
- Context snippet showing surrounding text
- "Unlinked mentions" section (mentions without `[[]]`)

**Interaction:**
- Click to open linked note
- Click line number to jump to specific line

**Quallaa adoption:** ✅ Match core functionality, defer "unlinked mentions" to Phase 2+

---

## Tags System

### Tag Syntax

**Support multiple formats:**
- Inline: `#tag` or `#nested/tag`
- Frontmatter:
  ```yaml
  ---
  tags: [project, active]
  ---
  ```

**Tag browser:**
- Hierarchical tree view
- Click to filter notes
- Show count per tag

**Quallaa adoption:** ✅ Support both formats

---

## File Organization

### Vault Concept

**Obsidian approach:**
- Vault = folder on disk
- Can have nested folders
- Emphasis on flat namespace in UI
- Quick switcher ignores folders

**Quallaa difference:**
- ❌ No "vault" concept
- ✅ Git project = organizational unit
- ✅ Still use flat namespace UI
- ✅ Notes are files within project

**Why different:** We're an IDE that happens to have great knowledge features, not a notes app that happens to have code execution.

---

## Settings and Preferences

### Relevant Settings

**File & Links:**
- New note location (same folder, root, specific folder)
- Default location for new notes
- Attachment folder path

**Editor:**
- Default editing mode (Source / Live Preview)
- Show line numbers
- Readable line length

**Appearance:**
- Base theme (light / dark)
- Custom CSS

**Quallaa adoption:** ✅ Similar settings structure, integrate into Theia preferences system

---

## What We Don't Adopt

### Vault-Specific Features

- ❌ Vault switcher (we use workspace/project)
- ❌ Per-vault settings (we use per-project workspace settings)
- ❌ Vault encryption (defer to git-crypt or similar)

### Plugin System

- ❌ Obsidian plugin compatibility
- ✅ Build our own Theia extension system
- ✅ May provide plugin API later

### Community Features

- ❌ Obsidian Publish
- ❌ Obsidian Sync
- ❌ Community plugins marketplace
- ✅ Build our own: AI agent marketplace

---

## Key Differences Summary

| Feature | Obsidian | Quallaa |
|---------|----------|---------|
| Organizational unit | Vault | Git project |
| Platform | Desktop app | IDE (desktop + web) |
| Code execution | Plugins only | Built-in terminal, debug, git |
| AI integration | Via plugins | First-class AI chat panel |
| Plugin ecosystem | Community plugins | Theia extensions + AI agents |
| Target user | Note-takers | Natural language developers |
| Primary use case | PKM, writing | Knowledge-first development |

---

## Related Documents

- [[Architecture Decisions]] - What we decided to adopt
- [[Project Vision - Knowledge-First IDE]] - Our differentiators
- [[Natural Language Developers]] - Our target users
- [[Obsidian-Like Experience]] - UX goals
- [[Wiki Links]] - Implementation details
- [[WYSIWYG Markdown Editor]] - Editor implementation

---

## Sources

All information gathered from:
- Obsidian Help documentation (help.obsidian.md)
- Obsidian Forum discussions (forum.obsidian.md)
- Web research conducted 2025-10-26
- Community discussions and user feedback
