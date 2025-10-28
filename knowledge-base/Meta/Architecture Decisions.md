# Architecture Decisions

**Detailed rationale for key decisions. For quick reference, see
[[Decisions Summary]].**

**Last Updated:** 2025-10-26

---

## Code Execution Model: AI Chat Integration

**Decision:** No inline code execution like Jupyter. AI chat panel for code
generation.

**Why:** Natural language developers describe intent; terminal/IDE handle
execution.

**Implementation:**

- AI chat panel in sidebar
- Generate code from descriptions
- Context-aware based on current note

---

## Business Model: Open Source + Custom Agents

**Decision:** Core fully open source (EPL 2.0). Monetize via custom AI agents.

**Why:** Build trust through openness; natural monetization through specialized
agents.

**Timeline:** Defer monetization until after 1.0 release.

---

## Progressive Disclosure: Not Implementing

**Decision:** No automatic progressive disclosure based on user behavior.

**Why:** Users prefer explicit control; predictability > "smart" UI.

**Alternative:** Simple preference toggle: "Show advanced IDE features"

---

## File Organization: Flat Namespace View

**Decision:** Flat namespace, tags-first. De-emphasize folder hierarchy in UI.

**Implementation:**

- Notes Library shows all notes by title (not tree)
- Tags Browser prominent in activity bar
- File Explorer available but rank 500+

---

## Quick Switcher: Obsidian-Exact Auto-Create

**Decision:** Cmd+O → fuzzy search → Enter creates if no match.

**Why:** Frictionless note creation, matches Obsidian expectations.

---

## WYSIWYG Editor: Hybrid Toggle Approach

**Decision:** Live Preview default, toggle to source with Cmd+E.

**Implementation:**

- TipTap for Live Preview
- Monaco for source mode
- Per-file persistent, global default setting
- Show syntax only around cursor

---

## Foam Integration: Extract Algorithm Only

**Decision:** Study foam-core, extract algorithms. Don't use as NPM dependency.

**Why:** More control, easier to customize, avoid dependency lifecycle issues.

**Extract:** Wiki link parsing, graph data structure, backlink detection,
metadata extraction.

---

## Platform Priority: Electron First

**Decision:** Focus on Electron for Phase 1 and MVP.

**Why:** Better file access, native feel, matches user expectations for desktop
app.

**Trade-off:** Larger download, platform-specific installers needed.

---

## File Storage: Local File System with Theia FileService

**Decision:** Use Theia's FileService for all file operations. Local only
Phase 1.

**Why:** Robust abstraction, scheme-based routing, extensible to cloud later.

**Implementation:**

- `file://` scheme for local notes
- Git repository = organizational unit (no "vaults")
- Leverage FileService events for real-time updates

---

## Obsidian Compatibility: Inspired By, Not Compatible

**Decision:** Adopt Obsidian's best UX patterns, but don't aim for file format
compatibility.

**Why:** Quallaa is a competitor building a knowledge-first IDE. Full
compatibility would limit innovation.

**What We Adopt:** Wiki link UX, backlinks design, graph view patterns, Live
Preview, quick switcher, shortest-path resolution.

**What We Don't:** Vault concept, plugin compatibility, 100% file format
compatibility.

---

## Wiki Link Ambiguity: Shortest Path with Disambiguation

**Decision:** `[[Note]]` if unique; `[[Folder/Note]]` if ambiguous.

**Resolution Order:**

1. Exact filename (case-insensitive, ignore .md)
2. Normalized (spaces/-/\_ equivalent)
3. Frontmatter aliases/title
4. Most recently modified
5. Show disambiguation in autocomplete

---

## Broken Link Behavior: Auto-Create on Click

**Decision:** Click broken link → immediately create and open note.

**Why:** Frictionless note creation (core to knowledge-first UX).

**Behavior:** No confirmation, created in same folder, broken links styled
differently.

---

## WYSIWYG Editor Mode: Per-File with Global Default

**Decision:** Live Preview default globally. Per-file toggle with Cmd+E. Each
file remembers mode.

**Why:** Matches Obsidian Live Preview approach users expect.

---

## Activity Bar Ranking: Knowledge-First Layout

**Ranking:** 50=Notes Library, 60=Tags, 70=Graph, 80=Backlinks, 90=AI Chat,
500+=IDE features.

**Why:** Lower rank = higher priority. Knowledge features primary, IDE features
available but not prominent.

---

## Graph View Click Behavior: Context-Dependent Navigation

**Decision:** Click=open same pane, Cmd+Click=split pane, hover=preview.

**Why:** Simple for beginners, powerful for advanced users, matches IDE
conventions.

---

## Knowledge Base Evolution: Living Documentation for AI

**Decision:** Knowledge base serves as living docs AND primary AI agent context.

**Purpose:** Living documentation, AI context source, decision record,
onboarding tool.

**Future: Librarian Agent** - AI agent that maintains KB, suggests updates,
identifies gaps.

---

## AI Provider Default: Claude (Anthropic)

**Decision:** Claude default, maintain multi-provider support via Theia AI's
LanguageModelRegistry.

**Why:** Excellent code generation, strong context handling, privacy-focused,
using Claude Code for development.

**Supports:** OpenAI, Google, HuggingFace, Ollama, Llamafile
(user-configurable).

---

## Extension Structure: New knowledge-base Package

**Decision:** Create `theia-extensions/knowledge-base` for all knowledge
management features.

**Structure:**

```
theia-extensions/knowledge-base/
├── src/
│   ├── browser/   # Wiki links, widgets, UI
│   ├── node/      # Indexing, file watching
│   └── common/    # Shared types
```

**Why:** Cohesive feature set, substantial scope, could publish independently,
follows Theia patterns.

---

## Distribution for MVP: GitHub Releases

**Decision:** GitHub Releases for Alpha/MVP. Add package managers later.

**Phase 1:** GitHub Releases, manual uploads, `0.1.0-alpha.X` versioning.

**Phase 2:** Add Homebrew, winget, automated builds.

**Phase 3:** Add Snap/Flatpak, optional CDN.

---

## Git Workflow: Phased Approach

**Decision:** Direct to master now, feature branches when implementation starts.

**Current:** Direct commits to YOUR fork's master branch. Fast iteration on
docs.

**Phase 1.2+:** Feature branches, merge to master, optional PRs.

**Clarification:** "master" = YOUR fork (jefftoffoli/Quallaa-app), NOT upstream
Theia.

---

## Image Handling: Traditional Embedding, No Visual Compression in Storage

**Decision:** Support traditional image embedding (`![[image.png]]`) in Phase
3+. Do NOT use visual compression (DeepSeek-OCR) for storage layer.

**Why:** Visual compression breaks core features (wiki links, backlinks, search)
that require text parsing. Images are supporting content for
[[Natural Language Developers]] who work primarily in text.

**Implementation:**

- Phase 3: Basic image embedding with `![[image.png]]` syntax
- Phase 4: Enhanced features (hover preview, size control, image browser)
- Phase 5: Advanced features (image backlinks, graph nodes, OCR search)
- Follow Obsidian-compatible syntax and path resolution

**Visual Compression Alternative:** DeepSeek-OCR offered as paid cloud AI
service (Phase 7) for semantic search and cross-document synthesis. Completely
separate architecture from IDE storage layer.

**Key Insight:** Images as content (traditional embedding) vs images as AI
compression format (cloud service) are two different use cases with different
architectures.

See: [[Image Handling]], [[DeepSeek-OCR Integration Assessment]],
[[Monetization Strategy - AI Cloud Services]]

---

## Technical Constraints

**Must Have:**

- Theia fork (not extension)
- EPL 2.0 license
- Monorepo structure
- TypeScript + React

**Default Visible Panels:** Notes Library, Tags, Graph, Backlinks, AI Chat

**Hidden by Default:** File Explorer, Git, Terminal, Debug

---

## Change Log

**2025-10-27:** Image handling (traditional embedding Phase 3+, no visual
compression in storage)

**2025-10-26:** AI provider (Claude), extension structure, distribution (GitHub
Releases), git workflow approved

**2025-10-26:** Platform (Electron), file storage (FileService), Obsidian
approach (inspired not compatible), wiki links, broken links, WYSIWYG, activity
bar, graph clicks, KB purpose

**2025-10-25:** Code execution (AI Chat), business model, progressive disclosure
(removed), file org (flat namespace), quick switcher, Foam integration
