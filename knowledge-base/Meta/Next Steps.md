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
**Status:** ✅ **VALIDATED** (2025-11-13)
**Approach chosen:** Reload-based switching (pragmatic solution)
**Findings:**
- KBViewShell successfully creates custom layout with Ribbon + dual sidebars
- Preference-based shell selection works at startup
- Runtime shell swapping too complex for MVP - requires page reload
- **Decision:** Implement reload dialog for mode switching

**Implementation:**
1. ✅ KBViewShell extends ApplicationShell with custom layout
2. ✅ ViewModeService reads preference and selects shell at startup
3. ⏳ Add reload dialog when user changes view mode preference
4. ⏳ Auto-reload with preserved preference state

### Experiment 2: Custom Sidebar Widgets
**Status:** ✅ **VALIDATED** (2025-11-13)
**Approach chosen:** Greenfield custom SidebarWidget (NOT wrapping Theia panel handlers)
**Findings:**
- Custom SidebarWidget successfully implemented as Lumino widget
- Greenfield approach avoids conflicts with Theia's panel system
- Dual sidebars can be visible simultaneously
- **Next:** Wire up existing widgets (Knowledge Graph, Backlinks, etc.) to sidebars

**Implementation:**
1. ✅ SidebarWidget class created with panel container functionality
2. ✅ SidebarService manages custom sidebar instances
3. ✅ KBViewShell creates left and right sidebar instances
4. ⏳ Test adding Theia widgets to custom sidebars
5. ⏳ Validate panel visibility toggling

### Experiment 3: Ribbon Component Prototype
**Status:** ✅ **VALIDATED** (2025-11-13)
**Findings:**
- Ribbon widget renders successfully with React
- Toggle behavior (vs switch) works as designed
- Contribution pattern allows extensions to register icons
- Design tokens provide consistent theming
- **Next:** Test interaction with real sidebar panels

**Implementation:**
1. ✅ RibbonWidget React component with styling
2. ✅ RibbonItemRegistry with contribution point
3. ✅ DefaultRibbonContribution registers 7 icons
4. ✅ Design tokens and theme-aware CSS
5. ✅ Keyboard accessibility (Enter/Space keys)
6. ⏳ Wire up ribbon clicks to show/hide sidebar panels

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

## Current Implementation Phase

**Phase 8: KB View UI** - ✅ Foundation validated, 🚧 Integration in progress

### Completed (Phase 8.1-8.5)
1. ✅ SidebarService - Core service for panel visibility management
2. ✅ RibbonItemRegistry - Contribution system for extensions
3. ✅ RibbonWidget - React component with theming
4. ✅ KBViewShell - Custom shell with greenfield layout
5. ✅ ViewModeService - Preference-based shell selection
6. ✅ DefaultRibbonContribution - 7 default icons registered
7. ✅ Design tokens and theme utilities

### In Progress (Phase 8.6)
**Current task:** Implement reload dialog for view mode switching

**Steps:**
1. ⏳ Add MessageService for user notifications
2. ⏳ Create reload confirmation dialog
3. ⏳ Auto-reload on user confirmation
4. ⏳ Test mode switching flow (KB View ↔ Developer View)

### Next Steps (Phase 8.7+)
1. Wire up ribbon clicks to sidebar panel visibility
2. Test adding Knowledge Graph widget to left sidebar
3. Test adding Backlinks widget to right sidebar
4. Validate dual sidebar simultaneous visibility
5. Polish UX (animations, transitions)
6. E2E tests for KB View mode

**Estimated remaining effort:** 2-3 weeks

### Phase 9: WYSIWYG Editor (approach TBD)
- Editor library evaluation (TipTap vs ProseMirror)
- Integration with Monaco editor system
- Hybrid editing mode (source ↔ WYSIWYG toggle)
- Testing and polish

**Estimated effort:** 3-4 weeks (depends on library choice)

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

## Key Architectural Questions

**Resolved - KB View UI (2025-11-13):**
- ✅ Shell swapping mechanism: **Reload-based** (requires page reload, not runtime swap)
- ✅ Widget state preservation: **Not needed** (preference preserved across reload)
- ✅ Sidebar architecture: **Greenfield custom SidebarWidget** (not wrapping Theia panels)
- ✅ Extension structure: **Monorepo extension** (theia-extensions/kb-view)
- ✅ Timeline feasibility: **~2-3 weeks remaining** (foundation complete in Phase 8.1-8.5)

**Open Questions - KB View UI:**
- ⏳ How to wire Theia widgets into custom sidebars?
- ⏳ Performance with many sidebar panels?
- ⏳ Should panels auto-save visibility state per workspace?

**Open Questions - WYSIWYG Editor:**
- ⏳ Editor library: TipTap, ProseMirror, or other?
- ⏳ Integration pattern: Replace Monaco or coexist?
- ⏳ Mode switching: How to toggle between source and WYSIWYG seamlessly?
- ⏳ Performance: Can we handle 1000+ line documents?

**Open Questions - Sequencing:**
- ⏳ Ship KB View UI first, or start with WYSIWYG in parallel?
- ⏳ Which provides more user value sooner?

**Current Direction:**
- ✅ Custom shell architecture **validated and working**
- ✅ Ribbon + dual sidebars **implemented and tested**
- 🚧 Implementing reload dialog for mode switching (Phase 8.6)
- ⏳ WYSIWYG editor research pending

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
