# Open Questions

Questions we need to answer before/during implementation.

## Core Features

### Inline Code Execution
**Status:** ❌ User indicated NO

**Original idea:** Execute code blocks inline like Jupyter
**User feedback:** "I don't think this is what we actually want"

**Need to clarify:**
- What DO we want instead?
- View-only code blocks with syntax highlighting?
- Link to external execution environment?
- Copy code to separate editor on demand?

### WYSIWYG vs Source
**Question:** Should WYSIWYG be the ONLY mode, or should users be able to toggle to source?

**Options:**
1. WYSIWYG only (most Obsidian-like)
2. Toggle between WYSIWYG and source (hybrid)
3. Side-by-side WYSIWYG + source (like Typora)

**Considerations:**
- Power users may want source access
- Source mode needed for debugging markdown
- But WYSIWYG should be default

## Progressive Disclosure

### Initial Detection
**Question:** How do we determine user's initial technical level?

**Options:**
1. Ask on first launch ("I'm a: Beginner / Developer / Power User")
2. Start everyone as beginner, adapt automatically
3. Detect from imported notes/vault
4. Let users choose in preferences

### Feature Revelation
**Question:** Should users be able to manually "unlock" features early?

**Options:**
1. Strict progression (can't access until unlocked)
2. Hidden but accessible via command palette
3. "Advanced Mode" toggle to show everything
4. Right-click anywhere → "Show all panels"

### Tutorial System
**Question:** When new features reveal, how do we teach them?

**Options:**
1. Tooltip/popover explaining new panel
2. Welcome/tutorial notes that appear
3. Guided tour on first reveal
4. Inline help in panels themselves

## File Organization

### Default Structure
**Question:** What should default vault structure look like?

**Options:**
```
Flat:
vault/
├─ Note 1.md
├─ Note 2.md
└─ Note 3.md

Organized:
vault/
├─ Daily Notes/
├─ Projects/
├─ Areas/
├─ Resources/
└─ Archive/

Hybrid:
vault/
├─ [date].md (daily notes)
└─ notes/
    ├─ [topic].md
    └─ ...
```

### Tags vs Folders
**Question:** Primary organization metaphor?

**Considerations:**
- Obsidian supports both
- Tags more flexible
- Folders more familiar
- Nested tags vs nested folders?

## Compatibility

### Foam/Obsidian Vaults
**Question:** Full compatibility or "inspired by"?

**Full compatibility means:**
- ✅ Can open existing vaults
- ✅ Use same file format
- ❌ Limited by their conventions
- ❌ Can't add breaking changes

**Inspired by means:**
- ✅ More freedom to innovate
- ✅ Can add enhancements
- ❌ Migration barrier
- ❌ Can't easily switch

### Obsidian Plugins
**Question:** Should we support Obsidian plugins?

**Considerations:**
- Obsidian plugins use their API
- Would need compatibility layer
- OR: Build our own plugin system
- OR: No plugins, opinionated product

## Business Model

### Open Source vs Proprietary
**Question:** License and monetization strategy?

**Options:**
1. Fully open source (MIT/Apache)
   - Community-driven
   - Hard to monetize
   - Maximum adoption

2. Open core
   - Base features open source
   - Premium features paid
   - Dual license

3. Source available
   - Code visible but not freely licensed
   - Paid product
   - Controlled development

### Pricing Model (if paid)
**Question:** How to charge?

**Options:**
1. One-time purchase (like Obsidian)
2. Subscription (like GitHub Copilot)
3. Freemium (basic free, pro paid)
4. Enterprise license only

## Technical Decisions

### Electron vs Web-First
**Question:** Primary target platform?

**Theia supports both, but focus matters:**

**Electron-first:**
- ✅ Better file system access
- ✅ More like native app
- ✅ Can bundle everything
- ❌ Larger download
- ❌ Slower startup

**Web-first:**
- ✅ No installation
- ✅ Cross-platform by default
- ✅ Easy updates
- ❌ Limited file system access
- ❌ Requires backend service

### AI Integration
**Question:** How deep should AI integration be?

**Ideas discussed but not detailed:**
- AI chat in sidebar?
- Generate code from descriptions?
- Summarize notes?
- Suggest connections?
- Auto-tag notes?

**Need to decide:**
- Which AI provider (OpenAI, Anthropic, local)?
- How to handle API keys?
- Privacy implications?
- Offline support?

## UX Details

### Quick Switcher Behavior
**Question:** What should Cmd+O do with non-existent notes?

See: [[Quick Switcher]]

**Obsidian behavior:**
- Shows matching notes
- If no match, creates new note with that name

**Should we:**
- Match Obsidian exactly?
- Show "Create note" as explicit option?
- Require Enter to create (prevent accidents)?

### Graph View Interaction
**Question:** What happens when you click a node?

**Options:**
1. Open note in same pane (replaces current)
2. Open in new pane (split view)
3. Show preview popup (hover to read)
4. User preference?

## Next Steps

See: [[Next Steps]]

**These questions should be answered before:**
- Finalizing architecture
- Starting implementation
- Building prototypes
- User testing

**Priority questions:**
1. ❗ Inline code execution clarification
2. ❗ WYSIWYG vs source toggle
3. ❗ Open source vs proprietary
4. Business model (if proprietary)
5. AI integration scope
