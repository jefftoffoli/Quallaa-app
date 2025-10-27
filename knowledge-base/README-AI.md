# README for AI Agents

**Token-optimized guide for AI consumption.**

## Start Here

**For all decisions:** Read [[Decisions Summary]] (≈500 tokens)
- All major decisions in table format
- Status of each decision
- 1-sentence rationale

## Common Queries

### "What have we decided?"
→ Read [[Decisions Summary]]

### "What's the project vision?"
→ Read [[Project Vision - Knowledge-First IDE]] (≈300 tokens)

### "What's next to implement?"
→ Read [[Next Steps]] (≈800 tokens) for phase-by-phase roadmap

### "How do I implement wiki links?"
→ Read [[Wiki Links]] for patterns, then [[Theia File Service]] for file operations

### "What did we learn from Obsidian?"
→ Read [[Obsidian Feature Comparison]] for UX patterns we're adopting

### "How should code be structured?"
→ Read [[Extension Structure Decision]] (≈200 tokens)

### "What's the git workflow?"
→ Read [[Git Workflow Strategies]] (≈150 tokens, now trimmed)

## Architecture References

**Need to understand Theia?**
- [[Next.js vs Theia Architecture]] - High-level comparison
- [[Dependency Injection in Theia]] - How DI works
- [[Theia File Service]] - File operations API

**Need to implement a feature?**
- [[Widget System]] - How widgets work
- [[Activity Bar]] - How to add panels
- [[Frontend and Backend Communication]] - RPC patterns

## Document Hierarchy

**Tier 1 (Always load):**
- [[Decisions Summary]] - Quick reference
- [[Next Steps]] - Implementation roadmap

**Tier 2 (Load for context):**
- [[Project Vision - Knowledge-First IDE]]
- [[Architecture Decisions]] (detailed rationale)

**Tier 3 (Load as needed):**
- Feature docs: Wiki Links, Backlinks, Graph View, etc.
- Architecture docs: Theia File Service, DI, etc.
- Implementation guides: Extension Structure, Git Workflow

**Tier 4 (Archive, rarely needed):**
- [[Meta/Archive/Open Questions]] - Historical
- [[Conversation Index]] - Full history

## Token Budget Recommendations

**Initial context load:** ~1000 tokens
- Decisions Summary (500)
- Project Vision (300)
- Next Steps (200)

**Feature implementation:** +500-800 tokens
- Relevant feature doc
- Relevant architecture doc

**Total per session:** 1500-2000 tokens typical

## Avoidheavy Documents

These are now archived or verbose:
- ❌ Don't load: Meta/Archive/Open Questions (historical)
- ❌ Avoid: Full Architecture Decisions (use Decisions Summary instead)
- ❌ Skip: Conversation Index (unless debugging)

## Update Protocol

When decisions change:
1. Update [[Decisions Summary]] (primary source of truth)
2. Update [[Architecture Decisions]] (detailed rationale)
3. Update feature docs as needed
4. Archive outdated questions

## For Librarian Agent

**Your job:**
- Keep Decisions Summary current
- Identify contradictions between docs
- Suggest consolidations
- Flag outdated content
- Maintain cross-references
- Ensure token efficiency

**Priorities:**
1. Accuracy (decisions match code)
2. Brevity (no redundancy)
3. Findability (good cross-links)
4. Currency (update dates)
