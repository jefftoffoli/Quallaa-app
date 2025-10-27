# Open Questions

Questions we need to answer before/during implementation.

## Core Features

### Code Execution Model
**Status:** ✅ DECIDED - AI Chat Integration

**Decision:** No inline code execution like Jupyter. Instead, integrate AI chat for code generation and assistance.

**Implementation:**
- AI chat panel in sidebar
- Generate code from natural language descriptions
- Users can copy/paste generated code to execute in terminal
- Focus on AI-assisted development workflow

### WYSIWYG vs Source
**Status:** ⏳ DEFERRED - Implement hybrid approach as documented in [[WYSIWYG Markdown Editor]]

**Decision:** Use hybrid approach (Option 2) - toggle between WYSIWYG and source
- WYSIWYG is default
- Toggle button for power users to switch to source mode
- Both modes sync content bidirectionally

## Progressive Disclosure

**Status:** ❌ NOT IMPLEMENTING

**Decision:** No automatic progressive disclosure based on user behavior detection.

**Rationale:**
- Adds complexity without clear benefit
- Users prefer explicit control over UI
- Can still have sensible defaults without automatic detection

**Alternative Approach:**
- Provide good default panel layout
- Allow manual show/hide of panels
- Consider simple preference: "Show advanced IDE features" checkbox

## File Organization

### Default Structure
**Status:** ✅ DECIDED - Flat namespace with optional folders

**Decision:** Support flat namespace view by default
- Show notes by title, not folder hierarchy
- Hide folder structure in primary navigation
- File explorer available but not prominent
- Users can organize with folders if they want, but UI emphasizes flat view

### Tags vs Folders
**Status:** ✅ DECIDED - Tags primary, folders secondary

**Decision:**
- Tags are the primary organization metaphor
- Folders supported but de-emphasized in UI
- Flat namespace view shows all notes together
- Tags browser is prominent in activity bar

## Compatibility

### Obsidian Compatibility
**Status:** ✅ DECIDED - Inspired by, not compatible

**Decision:** Learn from Obsidian's best ideas, but don't aim for file format compatibility.

**Rationale:**
- Quallaa is a competitor to Obsidian, not a compatible tool
- We're building a knowledge-first **IDE** with full code execution
- Git-project paradigm differs from vault paradigm
- Focus on being better, not compatible

**What We Adopt:**
- Wiki link UX patterns
- Backlinks panel design
- Graph view interactions
- Live Preview editing
- Quick switcher behavior
- Shortest-path link resolution

**What We Don't:**
- Vault concept (we use Git projects)
- Obsidian plugin compatibility
- File format 100% compatibility
- Community plugins

**Related:** [[Architecture Decisions]], [[Obsidian Feature Comparison]]

## Business Model

**Status:** ✅ DECIDED - Open Source + Custom Agents

### Open Source Strategy
**Decision:** Build first, monetize later
- Core IDE fully open source (EPL 2.0)
- Focus on building great product first
- Community-driven development

### Monetization Plan
**Decision:** Sell custom AI agents for chat
- Base AI chat integration is free/open
- Premium: Custom agents with specialized knowledge
- Premium: Domain-specific agents (e.g., for specific frameworks, languages)
- Potential subscription model for agent marketplace

**Timeline:** Defer monetization until after 1.0 release

## Technical Decisions

### Platform Priority
**Status:** ✅ DECIDED - Electron first

**Decision:** Focus on Electron desktop application for Phase 1 and MVP.

**Implementation:**
- Local file system storage
- Theia FileService for file operations
- Git project = organizational unit (no "vaults")
- Web version deferred to later phase

**Related:** [[Architecture Decisions]], [[Theia File Service]]

---

### File Storage Architecture
**Status:** ✅ DECIDED - Use Theia FileService

**Decision:** Use Theia's existing FileService abstraction for all file operations.

**Benefits:**
- Scheme-based routing (extensible to cloud later)
- Event-driven updates
- Tested and robust
- Can add custom providers later

**Related:** [[Architecture Decisions]], [[Theia File Service]]

---

### AI Provider Architecture
**Status:** ✅ RESEARCHED - Theia has abstraction layer

**Finding:** Theia AI already provides provider-agnostic architecture via LanguageModelRegistry.

**Supports:**
- Multiple providers (OpenAI, Anthropic, Google, HuggingFace)
- Local models (Ollama, Llamafile)
- Runtime configuration
- Vercel AI SDK integration (2025)

**Action:** Use existing Theia AI architecture for Phase 7 implementation.

**Still to decide:** Which specific provider(s) to enable by default

**Related:** [[Architecture Decisions]], [[Theia AI Integration]]

---

### Telemetry and Privacy
**Status:** ✅ RESEARCHED - Theia has zero telemetry by default

**Finding:** Theia has no built-in telemetry, only update checks.

**Default Behavior:**
- No user activity tracking
- No code/project data collection
- Only checks for Theia IDE updates
- Fully open source (verifiable)

**Action:** Maintain Theia's privacy-first approach. No telemetry in Quallaa.

**Related:** [[Architecture Decisions]]

## UX Details

### Wiki Link Ambiguity Resolution
**Status:** ✅ DECIDED - Shortest path with disambiguation

**Decision:** Use "shortest path when possible" - only add folder path when duplicate names exist.

**Resolution order:**
1. Exact filename match (case-insensitive)
2. Normalized match (spaces/-/_ equivalent)
3. Frontmatter aliases or title field
4. Most recently modified if still ambiguous
5. Show disambiguation in autocomplete

**Related:** [[Architecture Decisions]], [[Wiki Links]], [[Obsidian Feature Comparison]]

---

### Broken Link Behavior
**Status:** ✅ DECIDED - Auto-create on click

**Decision:** Clicking broken link immediately creates and opens new note.

**Behavior:**
- No confirmation dialog
- Created in same folder as current note
- Broken links shown in different color
- Supports folder paths in link name

**Related:** [[Architecture Decisions]], [[Wiki Links]]

---

### Quick Switcher Behavior
**Status:** ✅ DECIDED - Obsidian-exact auto-create

**Decision:** Match Obsidian behavior exactly.

**Behavior:**
- Cmd+O opens quick switcher
- Fuzzy search of note titles
- If no match, Enter creates new note with that name
- No explicit "Create note" button needed

**Related:** [[Quick Switcher]], [[Architecture Decisions]]

---

### Graph View Interaction
**Status:** ✅ DECIDED - Context-dependent navigation

**Decision:** Click to open, Cmd+Click to split, hover for preview.

**Behavior:**
- Click: Open in same pane
- Cmd+Click: Open in split pane
- Hover: Show tooltip preview
- Double-click: (Future) Zoom into local graph

**Related:** [[Knowledge Graph View]], [[Architecture Decisions]]

---

### WYSIWYG Editor Default
**Status:** ✅ DECIDED - Per-file with global default

**Decision:** Live Preview default, per-file toggle, global setting.

**Behavior:**
- Global default setting (Live Preview or Source)
- Cmd+E toggles per-file
- Each file remembers last mode
- Show markdown syntax only around cursor

**Related:** [[WYSIWYG Markdown Editor]], [[Architecture Decisions]]

---

### Activity Bar Layout
**Status:** ✅ DECIDED - Specific ranking approved

**Ranking:**
- 50: Notes Library
- 60: Tags Browser
- 70: Graph View
- 80: Backlinks
- 90: AI Chat
- 500+: Traditional IDE panels

**Related:** [[Activity Bar]], [[Architecture Decisions]]

## Next Steps

See: [[Next Steps]]

**These questions should be answered before:**
- Starting implementation ✅ (READY!)
- Building prototypes
- User testing

**Remaining open questions:**
1. ⏳ Alpha/Beta program structure (when to open to community)
2. ⏳ Git workflow transition timing (when to move from direct-to-master to feature branches)

**Recently decided (2025-10-26 session 2):**
1. ✅ Extension structure: Create new `theia-extensions/knowledge-base` package
2. ✅ Distribution MVP: GitHub Releases (simple, free)
3. ✅ AI provider default: Claude/Anthropic
4. ✅ Git workflow: Direct to master now, feature branches when implementation starts

**Recently decided (2025-10-26):**
1. ✅ Platform: Electron first
2. ✅ File storage: Theia FileService, local filesystem
3. ✅ Obsidian compatibility: Inspired by, not compatible
4. ✅ Wiki link ambiguity: Shortest path with disambiguation
5. ✅ Broken links: Auto-create on click
6. ✅ WYSIWYG default: Per-file with global setting
7. ✅ Activity bar ranking: Specific order approved
8. ✅ Graph view clicks: Context-dependent navigation
9. ✅ Knowledge base purpose: Living docs + AI context
10. ✅ Telemetry: None (maintain Theia's privacy-first approach)

**Previously decided (2025-10-25):**
1. ✅ Code execution model: AI Chat
2. ✅ Business model: Open source + sell custom agents
3. ✅ Progressive disclosure: Not implementing
4. ✅ File organization: Flat namespace view
5. ✅ Quick switcher: Obsidian-exact auto-create
