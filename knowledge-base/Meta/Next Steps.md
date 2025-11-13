# Next Steps

**Current project status and priorities**

**Last Updated:** 2025-11-13

---

## 🎯 TOP PRIORITIES

**Focus:** KB View UI and WYSIWYG Editor

**Status:** 🧪 **ARCHITECTURAL EXPLORATION PHASE** - Experimenting with approaches, nothing finalized

---

## Current Status

**Quallaa Version:** 1.66.100 (Based on Theia 1.66.1)

**Phase Completion:**
- ✅ **Phases 1-7:** COMPLETE - All core knowledge features implemented and tested
  - Wiki links, backlinks, tags, knowledge graph, daily notes, templates
  - 100 tests passing (45 unit + 55 E2E)
  - 87.5% feature parity with Foam

- 🧪 **Phase 8:** EXPLORING - KB View UI Architecture
  - ✅ Initial architecture research complete
  - ✅ Ribbon component concept designed
  - ✅ Implementation plan drafted
  - ⚠️ **Architecture NOT finalized - still exploring best approach**
  - ⏳ Implementation experiments not started

- 🧪 **Phase 9:** EXPLORING - WYSIWYG Editor
  - ⏳ Architecture research needed
  - ⏳ Editor library evaluation (TipTap, ProseMirror, others?)
  - ⏳ Integration approach undecided

- 📦 **Phase 10:** AI Cloud Services - Deprioritized
- 📦 **Phase 11:** Polish & Launch - Deprioritized

---

## Architecture Exploration (2025-11-09 onwards)

**Current Direction:** Build custom Obsidian-inspired UI for KB View instead of hiding panels

**Exploring:**
- **OLD approach:** Hide IDE panels to create simplified KB View
- **NEW approach:** Build custom shell with Ribbon + dual sidebars

**Why:** Creates a true knowledge-first experience that feels like Obsidian, not "VS Code with features removed"

**Open Questions:**
- How to implement shell swapping in Theia (multiple approaches possible)
- Whether to extend or replace ApplicationShell
- How to preserve widget state during mode switching
- Best pattern for custom sidebars (reuse Theia patterns vs greenfield)
- Timeline and complexity (rough estimate: 4-6 weeks, pending validation)

**Research Artifacts:** [[KB View - Obsidian-Style UI Architecture]], [[Ribbon Component Design]], [[KB View UI Implementation Plan]]

**NOTE:** All design documents are exploratory and subject to change as we validate approaches through experimentation.

---

## Immediate Next Steps - Experimentation & Validation

**Goal:** Validate architectural approaches through small experiments before committing to full implementation

### Experiment 1: Shell Swapping Feasibility
**Status:** Not started
**Questions to answer:**
- Can we swap Theia shells at runtime?
- What's the simplest working prototype?
- How do widgets migrate between shells?
- What are the performance implications?

**Proposed approach:**
1. Create minimal KBViewShell prototype (empty layout)
2. Test shell swapping mechanism (multiple options to explore)
3. Validate widget preservation
4. Document findings and recommend approach

### Experiment 2: Custom Sidebar Widgets
**Status:** Not started
**Questions to answer:**
- Should we wrap Theia's panel handlers or build greenfield?
- Can we reuse existing Theia widgets in custom sidebars?
- What's the simplest working dual sidebar implementation?

**Proposed approach:**
1. Build minimal custom Sidebar widget container
2. Test adding Theia widgets (File Explorer) to custom container
3. Test multiple panels active simultaneously
4. Document integration challenges

### Experiment 3: Ribbon Component Prototype
**Status:** Not started
**Questions to answer:**
- Does the Ribbon design feel right?
- Can we achieve Obsidian-like interaction patterns?
- Integration complexity with Theia's DI system?

**Proposed approach:**
1. Build standalone Ribbon widget (no shell integration)
2. Test toggle behavior with mock sidebar
3. Get feedback on visual design and UX
4. Validate contribution pattern for extensions

### Next: WYSIWYG Editor Research
**Status:** Not started
**Questions to answer:**
- TipTap vs ProseMirror vs other editors?
- Monaco integration patterns?
- How to toggle between source and WYSIWYG modes?
- Performance with large documents?

**Proposed approach:**
1. Evaluate 2-3 editor libraries with small prototypes
2. Test markdown bidirectional conversion
3. Test integration with Theia's editor system
4. Document tradeoffs and recommend approach

---

## Potential Implementation Roadmap (TENTATIVE)

**NOTE:** This roadmap is speculative and will be revised based on experiment outcomes

### Phase 8: KB View UI (if experiments validate approach)
- Foundation: SidebarService and basic shell structure
- Ribbon Widget implementation
- Custom Shell layout
- Shell Management and mode switching
- Integration with knowledge base features
- Polish and testing

**Estimated effort:** 4-6 weeks (pending validation)

### Phase 9: WYSIWYG Editor (approach TBD)
- Editor library integration
- Hybrid editing mode (source ↔ WYSIWYG toggle)
- Enhanced image features
- Testing and polish

**Estimated effort:** 3-4 weeks (very rough, depends on library choice)

---

## Future Phases (Deprioritized for Now)

### Phase 10: AI Cloud Services
- Local-first vector search (Transformers.js)
- AI chat panel (context-aware)
- Optional cloud enhancement tier

**Status:** On hold pending KB View + WYSIWYG completion

### Phase 11: Polish & Launch
- UI refinement, dark/light mode polish
- Performance optimization (1000+ notes)
- User guide and video demos
- Electron builds and installers
- Public beta launch

**Status:** On hold pending core feature completion

---

## Key Architectural Questions (Exploring)

**Open Questions - KB View UI:**
- ⏳ Shell swapping mechanism: What's the best approach?
- ⏳ Widget state preservation: How to maintain editor content during shell swap?
- ⏳ Sidebar architecture: Wrap Theia panels or build greenfield?
- ⏳ Extension structure: Monorepo extension or separate package?
- ⏳ Timeline feasibility: Is 4-6 weeks realistic for this complexity?

**Open Questions - WYSIWYG Editor:**
- ⏳ Editor library: TipTap, ProseMirror, or other?
- ⏳ Integration pattern: Replace Monaco or coexist?
- ⏳ Mode switching: How to toggle between source and WYSIWYG seamlessly?
- ⏳ Performance: Can we handle 1000+ line documents?

**Open Questions - Sequencing:**
- ⏳ Ship KB View UI first, or start with WYSIWYG?
- ⏳ Build both in parallel with smaller scope?
- ⏳ Which provides more user value sooner?

**Tentative Direction (Subject to Change):**
- 🧪 Exploring custom shell architecture for KB View
- 🧪 Ribbon + dual sidebars design concept
- 🧪 All approaches subject to validation through experimentation

---

## Success Criteria (Tentative)

**Experiments Successful When:**
- 🧪 Shell swapping mechanism validated (proof of concept working)
- 🧪 Widget state preservation demonstrated
- 🧪 Custom sidebars can host Theia widgets
- 🧪 Ribbon interaction feels right (UX validation)
- 🧪 WYSIWYG editor library evaluated with working prototype

**KB View UI Complete When (if we proceed):**
- KB View uses Ribbon (not Activity Bar)
- Dual sidebars work simultaneously
- No bottom panel region in KB View
- Can switch between KB and Developer View seamlessly
- All existing features work in new shell
- 95%+ test coverage
- Shell switching <100ms
- Passes accessibility audit

**WYSIWYG Editor Complete When (approach TBD):**
- Seamless toggle between source and WYSIWYG modes
- Markdown rendering matches Obsidian Live Preview
- Performance acceptable with 1000+ line documents
- All existing markdown features work (wiki links, frontmatter, etc.)

**MVP Ready When:**
- Both KB View UI and WYSIWYG editor complete
- Performance validated with realistic knowledge bases
- User documentation written
- Ready for beta testers

---

## Known Risks

| Risk | Status | Notes |
|------|--------|-------|
| **Shell swapping complexity** | 🔴 High | Need to validate feasibility through experiments |
| **Widget state preservation** | 🔴 High | Complex Theia internals, may have edge cases |
| **Timeline uncertainty** | 🟡 Medium | Estimates are rough, could be 2x longer |
| **Theia breaking changes** | 🟢 Low | Pinned to 1.66.1, can control upgrade timing |
| **Ribbon UX doesn't feel right** | 🟡 Medium | Need early prototype feedback |
| **WYSIWYG editor integration** | 🔴 High | Haven't evaluated libraries yet |

**Mitigation Strategy:** Small experiments to validate approaches before committing to full implementation

---

## Research & Design Documents

**⚠️ NOTE:** All documents below are exploratory/speculative, not finalized designs

**Exploration Docs:**
- [[KB View - Obsidian-Style UI Architecture]] - Custom shell concept
- [[Ribbon Component Design]] - Ribbon widget concept
- [[KB View UI Implementation Plan]] - Potential roadmap (tentative)

**Research Docs:**
- `docs/THEIA_SHELL_ARCHITECTURE.md` - Theia technical deep-dive
- `docs/KB_VIEW_SHELL_DESIGN.md` - Shell implementation research

**Context:**
- [[Project Vision - Knowledge-First IDE]] - Core philosophy
- [[Obsidian-Like Experience]] - UX goals
- [[Natural Language Developers]] - Target users

---

## Change History

**2025-11-13:** Updated to reflect exploration phase - KB View + WYSIWYG are top priorities, architecture not finalized

**2025-11-09:** Initial custom shell architecture exploration, Phase 8 roadmap drafted

**2025-11-08:** Phases 1-7 complete, all tests passing (100 total)

**2025-11-07:** Phase 7 (Templates) verified via E2E tests

**2025-11-06:** Phase 6 (Daily Notes) verified via E2E tests

**2025-11-05:** Phase 5 (Testing & Polish) complete - All tests passing

---

**Current Priority:** Run architectural experiments to validate KB View UI and WYSIWYG Editor approaches before committing to implementation
