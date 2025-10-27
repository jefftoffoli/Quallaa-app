# Conversation Index

## Overview

This knowledge base was created from a detailed conversation about building a knowledge-first IDE using Theia.

## Conversation Flow

### 1. Initial Architecture Questions

**User Background:** Coming from Next.js, wanted to understand Theia

**Topics Covered:**
- [[Next.js vs Theia Architecture]]
- [[Frontend and Backend Communication]]
- [[Dependency Injection in Theia]]

**Key Metaphors:**
- Restaurant (Next.js) vs Swiss Army Knife (Theia)
- Phone call (HTTP) vs Walkie-talkie (RPC)
- LEGO instruction manual (DI)

### 2. UI Component Exploration

**User Question:** How does the Activity Bar → Explorer → Editor flow work?

**Topics Covered:**
- [[Activity Bar]]
- [[View Containers]]
- [[Widget System]]
- [[Theia Application Shell]]
- [[Side Panel Handlers]]

**Files Explored:**
- `@theia/core/src/browser/shell/application-shell.ts`
- `@theia/core/src/browser/shell/side-panel-handler.ts`
- `@theia/navigator/src/browser/navigator-contribution.ts`

### 3. Panel Layering and Priority

**User Questions:**
- How does priority structure work?
- Can panels layer on top of panels?

**Topics Covered:**
- [[Rank and Priority in Side Panels]]
- [[Single-Document vs Multiple-Document Mode]]

**Key Insight:** Side panels use single-document mode (only one visible), main area uses multiple-document (can split/tab)

### 4. Diff Editor Deep Dive

**User Question:** How does diff view show two editors side-by-side?

**Topics Covered:**
- [[Diff Editor Architecture]]
- [[URI Schemes in Theia]]

**Key Insight:** ONE widget with TWO editors inside, uses `diff://` URI scheme

### 5. Markdown Viewer Architecture

**User Question:** Could markdown viewer work like diff editor?

**Topics Covered:**
- [[Composite vs Separate Widget Patterns]]
- Two approaches: Composite widget vs Separate widgets
- Trade-offs between approaches

### 6. WYSIWYG Editor Question

**User Question:** Can we make Theia always open .md in WYSIWYG?

**Topics Covered:**
- [[OpenHandler Priority System]]
- [[OpenerService]]
- How to override default handlers

**Solution:** Return priority 1000 from custom handler

### 7. PROJECT VISION REVEALED

**Critical Pivot:** User clarified this isn't just learning Theia, it's building a specific product!

**User Quote:**
> "I'm not sure that a Theia extension is the idea... where I'm eventually hoping to get is a fork of theia that is dedicated to progressive disclosure for natural language developers."

**Topics Covered:**
- [[Project Vision - Knowledge-First IDE]]
- [[Natural Language Developers]]
- [[Progressive Disclosure Pattern]]

### 8. Foam Project Analysis

**User Reference:** https://github.com/foambubble/foam

**Topics Covered:**
- [[Foam Project Analysis]]
- What to borrow (foam-core, wiki links, graph)
- What to change (UI philosophy, WYSIWYG)

### 9. Critical User Feedback

**User Feedback:**
> "You added this part about inline code execution - I don't think this is what we actually want in our project."

**Topics Covered:**
- [[Open Questions]] - Documented this feedback
- Removed inline code execution from vision
- Clarified scope of project

### 10. Knowledge Base Creation Request

**User Request:**
> "Let's create a directory in this project called knowledge-base. I want you to review our conversation in detail and create separate atomic .md documents for every little topic that we have talked about."

**Result:** This knowledge base!

## Documents Created

### Core Vision
- [[Project Vision - Knowledge-First IDE]]
- [[Natural Language Developers]]
- [[Obsidian-Like Experience]]
- [[Progressive Disclosure Pattern]]

### Architecture
- [[Next.js vs Theia Architecture]]
- [[Dependency Injection in Theia]]
- [[Frontend and Backend Communication]]
- [[Monorepo Structure]]

### UI Components
- [[Theia Application Shell]]
- [[Widget System]]
- [[Activity Bar]]
- [[View Containers]]
- [[Side Panel Handlers]]

### Patterns and Concepts
- [[Single-Document vs Multiple-Document Mode]]
- [[Rank and Priority in Side Panels]]
- [[Composite vs Separate Widget Patterns]]
- [[URI Schemes in Theia]]

### File Opening
- [[OpenerService]]
- [[OpenHandler Priority System]]
- [[Diff Editor Architecture]]

### Knowledge Features
- [[Wiki Links]]
- [[Backlinks Panel]]
- [[Knowledge Graph View]]
- [[Quick Switcher]]
- [[Daily Notes]]
- [[Tags System]]
- [[WYSIWYG Markdown Editor]]

### Implementation
- [[Foam Project Analysis]]
- [[Open Questions]]
- [[Next Steps]]
- [[Conversation Index]] (this document)

## Key Decisions Made

### 1. Fork vs Extension

**Decision:** Fork Theia (not just extension)
**Reason:** Deep customization needed (activity bar, WYSIWYG, etc.)

### 2. Knowledge-First UI

**Decision:** Reorder Activity Bar to put knowledge features first
**Implementation:** Use rank 50-99 for our panels, 500+ for IDE panels

### 3. WYSIWYG Editor

**Decision:** Implement WYSIWYG markdown editor
**Approach:** Hybrid widget with TipTap (WYSIWYG) + Monaco (source) toggle

### 4. Progressive Disclosure

**Decision:** Adapt UI to user sophistication
**Approach:** Track user actions, reveal IDE features when needed

### 5. No Inline Code Execution

**Decision:** DON'T implement Jupyter-like code execution
**Reason:** User explicitly said "I don't think this is what we actually want"

## Unresolved Questions

See: [[Open Questions]]

1. WYSIWYG vs Source: Toggle or WYSIWYG-only?
2. Progressive Disclosure: Ask upfront or auto-detect?
3. Business Model: Open source vs proprietary?
4. Obsidian Compatibility: Full or inspired-by?
5. Initial Tech Level: How to detect?

## Next Actions

See: [[Next Steps]]

**Phase 1:** Set up project structure
**Phase 2:** Implement core knowledge features
**Phase 3:** Build WYSIWYG editor
**Phase 4:** Add progressive disclosure
**Phase 5:** Polish and launch

## Related Concepts

All documents in this knowledge base are part of one coherent vision:

**Build an Obsidian-like knowledge base that progressively reveals IDE features as users need them, targeting natural language developers who think in markdown but occasionally need code.**

## Timeline

- **Conversation Started:** [Original conversation date]
- **Project Vision Clarified:** Mid-conversation pivot
- **Knowledge Base Created:** [Date of creation]
- **Target MVP:** 14 weeks from start of implementation

## Document Relationships

```
Project Vision
    ↓
├─ Natural Language Developers (target user)
├─ Progressive Disclosure (core UX pattern)
└─ Obsidian-Like Experience (design goal)
    ↓
    ├─ Wiki Links
    ├─ Backlinks Panel
    ├─ Knowledge Graph View
    ├─ Quick Switcher
    ├─ Daily Notes
    ├─ Tags System
    └─ WYSIWYG Markdown Editor
        ↓
        All implemented using:
        ├─ Widget System
        ├─ Activity Bar
        ├─ OpenerService
        └─ Theia Architecture
```
