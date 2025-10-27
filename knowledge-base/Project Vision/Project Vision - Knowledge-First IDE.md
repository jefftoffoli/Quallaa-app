# Project Vision - Knowledge-First IDE

## The Core Idea

Building a **Theia fork** that puts knowledge management first, with IDE features progressively disclosed as needed.

**Target User:** [[Natural Language Developers]] - people who think in markdown and natural language, but occasionally need to execute code.

## Design Philosophy

### Knowledge-First, Not Code-First

**Traditional IDE:**
```
User Mental Model: "I'm a developer writing code"
Entry Point: File Explorer, Code Editor, Terminal
Markdown: Just another file type
```

**Our Vision:**
```
User Mental Model: "I'm building a knowledge base that can execute"
Entry Point: Note Library, Graph View, Daily Notes
Markdown: THE FIRST-CLASS CITIZEN
```

## Key Differentiators

### vs Obsidian
- ✅ Has Obsidian's knowledge management UX
- ➕ Adds real IDE capabilities (debugging, git, terminal)
- ➕ AI chat for code generation and assistance
- ➕ AI-native design from the ground up

### vs VS Code
- ✅ Has VS Code's powerful editing and execution
- ➕ Adds knowledge graph and linking
- ➕ Obsidian-like UI
- ➕ Progressive disclosure (less overwhelming)

### vs Foam
- ✅ Uses similar concepts (wiki links, backlinks, graph)
- ➕ Knowledge-first UI (not code-first with KB bolted on)
- ➕ [[WYSIWYG Markdown Editor]] by default
- ➕ Custom activity bar for KB workflows

## Positioning

**Tagline Ideas:**
- "Where knowledge becomes executable"
- "Your second brain, with superpowers"
- "Think in markdown, execute in any language"

**Target Markets:**
1. [[Natural Language Developers]]
2. AI-assisted coders
3. Technical writers
4. Researchers/Data Scientists

## Why Fork Theia?

See: [[Extension vs Fork Decision]]

- ✅ Full control over UI/UX
- ✅ Can customize application shell
- ✅ Can change default behaviors
- ✅ Web + Desktop (Electron) support
- ✅ Professional, maintained base

## Related Concepts

- [[Obsidian-Like Experience]] - UI/UX goals
- [[Progressive Disclosure Pattern]] - How to reveal complexity
- [[Foam Project Analysis]] - Reference implementation
- [[Theia Application Shell]] - Technical foundation

## Key Decisions

See: [[Open Questions]] for full list

**Decided:**
- ✅ AI chat integration for code generation (not inline execution)
- ✅ Open source (EPL 2.0) with monetization via custom AI agents
- ✅ Flat namespace view with tags-first organization
- ✅ No automatic progressive disclosure

**To Be Decided:**
- Graph view interaction behavior
- Obsidian compatibility level
- Plugin ecosystem approach
