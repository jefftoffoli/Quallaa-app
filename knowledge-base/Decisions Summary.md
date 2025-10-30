# Decisions Summary

**Quick reference for all major decisions. For details, see linked documents.**

**Last Updated:** 2025-10-29

## Platform & Architecture

| Decision                | Choice                                  | Rationale                                                            |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| **Platform Strategy**   | Multi-product platform (Option 3)       | Build shared infra with Quallaa first, HITL-GAN fast follow         |
| **Platform Priority**   | Electron first                          | Better file access, native feel, matches user expectations           |
| **File Storage**        | Theia FileService, local only (Phase 1) | Use existing abstraction, extensible to cloud later                  |
| **Project Structure**   | Git projects (not "vaults")             | IDE paradigm, not notes-app paradigm                                 |
| **Extension Structure** | New `theia-extensions/knowledge-base`   | Cohesive feature set, substantial scope, could publish independently |
| **Telemetry**           | None (privacy-first)                    | Maintain Theia's zero-telemetry approach                             |
| **GPU Infrastructure**  | Shared Kubernetes pool                  | 60-70% utilization vs 30-40% standalone, 40% cost savings            |

## Product Vision

| Decision                   | Choice                                                             | Rationale                                                                |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Obsidian Relationship**  | Inspired by, NOT compatible                                        | We're a competitor; focus on being better, not compatible                |
| **Code Execution**         | AI chat integration (no inline exec)                               | Natural language developers describe intent, not execute inline          |
| **Progressive Disclosure** | Not implementing                                                   | Users prefer explicit control over "smart" UI                            |
| **File Organization**      | Flat namespace, tags-first                                         | Target users think in concepts, not file paths                           |
| **Business Model**         | Platform: Open source + AI services + marketplace                  | Multiple revenue streams across product portfolio                        |
| **Image Handling**         | Traditional embedding (Phase 3+), NO visual compression in storage | Visual compression breaks core features; use as cloud AI service instead |

## HITL-GAN Product Vision

| Decision                 | Choice                                       | Rationale                                                     |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| **Primary Market**       | Game dev, marketing, design agencies         | Strong need for asset generation with human feedback          |
| **Voting Mechanisms**    | Multiple (binary, rating, pairwise, ranked)  | Different use cases require different feedback types          |
| **Voter Model**          | Two-sided marketplace with reputation system | Proven model (Amazon Mechanical Turk, Scale AI)               |
| **Integration Approach** | Theia extensions on shared platform          | Leverage existing infrastructure and development patterns     |
| **Launch Timing**        | 12 months after Quallaa launch               | Sequential product validation, reduce risk                    |
| **Revenue Model**        | Marketplace + subscriptions                  | Requesters pay per vote + monthly plans; voters earn 60-70%   |

## UX Patterns (Obsidian-Inspired)

| Feature             | Behavior                                                    | Source                   |
| ------------------- | ----------------------------------------------------------- | ------------------------ |
| **Wiki Links**      | Shortest path; `[[Note]]` or `[[Folder/Note]]` if ambiguous | Obsidian best practice   |
| **Link Resolution** | Case-insensitive, spaces/-/\_ equivalent, check aliases     | Obsidian approach        |
| **Broken Links**    | Auto-create on click, no confirmation                       | Obsidian frictionless UX |
| **WYSIWYG Mode**    | Live Preview default, Cmd+E toggles, per-file persistent    | Obsidian Live Preview    |
| **Quick Switcher**  | Cmd+O, fuzzy search, Enter creates if no match              | Obsidian exact behavior  |
| **Graph Clicks**    | Click=open, Cmd+Click=split, hover=preview                  | IDE convention + preview |

## Activity Bar Ranking

Lower rank = higher priority in UI.

| Rank | Feature       | Category                |
| ---- | ------------- | ----------------------- |
| 50   | Notes Library | Knowledge               |
| 60   | Tags Browser  | Knowledge               |
| 70   | Graph View    | Knowledge               |
| 80   | Backlinks     | Knowledge               |
| 90   | AI Chat       | Knowledge               |
| 500  | File Explorer | IDE (hidden by default) |
| 600  | Git           | IDE                     |
| 700  | Search        | IDE                     |
| 800  | Debug         | IDE                     |

## Implementation Decisions

| Decision                   | Choice                                                 | When                                |
| -------------------------- | ------------------------------------------------------ | ----------------------------------- |
| **AI Provider**            | Claude (Anthropic) default, multi-provider support     | Phase 7                             |
| **Distribution MVP**       | GitHub Releases, manual uploads                        | Phase 1-5                           |
| **Versioning**             | Semantic: `0.1.0-alpha.1` → `0.8.0-beta.1` → `1.0.0`   | All phases                          |
| **Git Workflow**           | Direct to master (now) → feature branches (Phase 1.2+) | Transition at implementation start  |
| **Phase 1.2-1.3 Order**    | Simple file scan in 1.2, proper indexing in 1.3        | Iterative approach, faster feedback |
| **Default KB Folder**      | Workspace root initially, user-configurable setting    | Phase 1.2+                          |
| **File Watching**          | Use Theia FileService events                           | Leverage existing architecture      |
| **Wiki Link Parsing**      | Regex extraction (not remark dependency)               | More control, simpler for MVP       |
| **Autocomplete Filtering** | Client-side (Monaco handles it)                        | Simpler, Monaco has fuzzy matching  |
| **Broken Link Detection**  | On document open (Phase 1.2), real-time later          | Good enough for daily use           |
| **Ambiguous Links**        | Show both with folder paths in autocomplete            | Clear disambiguation                |

## Knowledge Base Purpose

1. **Living documentation** - updated as we implement
2. **AI context source** - provides context to AI agents
3. **Decision record** - captures rationale
4. **Onboarding tool** - helps contributors understand

**Future: Knowledge Base Librarian Agent** - AI agent that maintains, improves,
and develops KB alongside user.

## Open Questions

1. ⏳ Alpha/Beta program timing (when to open to community)
2. ⏳ Git workflow transition trigger (exact timing)

## Document Index

**Core:**

- This file - All decisions at a glance
- [[Platform Strategy - Unified Vision]] - Multi-product platform strategy
- [[Next Steps]] - Implementation roadmap
- [[Project Vision - Knowledge-First IDE]] - Quallaa core concept
- [[HITL-GAN Platform - Business Proposal]] - HITL-GAN detailed proposal
- [[Quallaa + HITL-GAN Synergies]] - Cross-product value analysis

**Architecture:**

- [[Theia File Service]] - How to use FileService
- [[Dependency Injection in Theia]]
- [[Frontend and Backend Communication]]

**Features:**

- [[Wiki Links]] - Implementation details
- [[Backlinks Panel]]
- [[Knowledge Graph View]]
- [[WYSIWYG Markdown Editor]]
- [[Image Handling]] - Traditional embedding strategy

**Implementation:**

- [[Extension Structure Decision]] - How to organize code
- [[Git Workflow Strategies]] - Workflow details

**Reference:**

- [[Obsidian Feature Comparison]] - What we learned from Obsidian
- [[Foam Project Analysis]] - Algorithm reference

---

**For AI Agents:** Start here for all decisions. Read linked documents only for
implementation details.
