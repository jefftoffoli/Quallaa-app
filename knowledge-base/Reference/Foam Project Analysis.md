# Foam Project Analysis

## What Is Foam?

**Foam** is a VS Code extension that adds Obsidian-like knowledge management features to VS Code.

**Repository:** https://github.com/foambubble/foam

## Foam's Approach

```
VS Code (Code-First UI)
    +
Foam Extension (adds KB features)
    =
Hybrid: IDE with note-taking bolted on
```

## Key Features to Borrow

### 1. Wiki Links with Autocomplete

Foam provides `[[Note Name]]` linking with autocomplete:

```typescript
// Detects [[
// Searches all .md files
// Returns note titles as completion items
```

**We should implement:** [[Wiki Links]]

### 2. Backlinks Panel

Shows all notes that link to current note:

```typescript
// Scans workspace for [[Current Note]]
// Displays in tree view
// Click to jump to reference
```

**We should implement:** [[Backlinks Panel]]

### 3. Graph Visualization

D3.js-based graph of note connections:

```typescript
// Nodes = Notes
// Edges = [[WikiLinks]]
// Interactive: click to open
```

**We should implement:** [[Knowledge Graph View]]

### 4. Note Templates

Quick scaffolding for new notes

**We should implement:** Templates

## Foam's Architecture

```
foam/
├── packages/
│   ├── foam-vscode/           # VS Code extension
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── wikilinks.ts
│   │   │   │   ├── backlinks.ts
│   │   │   │   └── graph.ts
│   │   │   └── core/
│   │   └── package.json
│   │
│   └── foam-core/             # Platform-agnostic!
│       ├── src/
│       │   ├── markdown-provider.ts  # ← Wiki link parsing!
│       │   ├── note-graph.ts         # ← Graph data structure!
│       │   ├── model/
│       │   │   ├── note.ts
│       │   │   ├── graph.ts
│       │   │   └─ wikilink.ts
│       │   └── services/
│       │       ├── parser.ts
│       │       └── linker.ts
│       └── package.json
```

**Key Insight:** `foam-core` is platform-independent! We can extract algorithms from it.

**Decision:** Extract algorithms only, not use as dependency (see [[Architecture Decisions]])

### Key Modules Identified (2025-10-27 Research)

**markdown-provider.ts**
- Contains `wikiLinkPlugin` (ParserPlugin implementation)
- Regex: `/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g`
- Handles piped wikilinks: `[[target|display text]]`
- Case-insensitive matching

**note-graph.ts**
- Graph data structure with nodes and edges
- Slug querying for resolving wikilinks to files
- Bidirectional link tracking

**Key Foam Assumptions:**
- No duplicate filenames in workspace
- All notes are markdown files
- Uses remark/unified for markdown processing
- Integrates with remark-wiki-link plugin

**Third-Party Dependencies:**
- remark-wiki-link - Core wikilink parsing
- remark/unified ecosystem for markdown

## What to Take from Foam

✅ **Wiki link parsing logic** (extract algorithm, implement ourselves)
✅ **Graph data structure** (extract algorithm, implement ourselves)
✅ **Backlink detection algorithm** (extract algorithm, implement ourselves)
✅ **Note metadata extraction** (learn from their approach)
✅ **Link reference system** (learn from their approach)

**Why extract vs. depend:**
- More control over implementation
- Avoid dependency on external package lifecycle
- Can optimize for our specific needs
- Simpler to customize and extend

## What to Change

Our vision differs from Foam in key ways:

### UI Philosophy

**Foam:**
```
┌─┬────────────────────┐
│📁│ Explorer          │  ← VS Code standard
│🔍│ Search            │
│⎇ │ Source Control    │
│  │                   │
│🫧│ Foam (one icon)   │  ← Foam nested under one item
│  ├─ Graph            │
│  └─ Backlinks        │
└─┴────────────────────┘

Code-first with KB features added
```

**Our Vision:**
```
┌─┬────────────────────┐
│📚│ Notes Library     │  ← Knowledge-first!
│🏷️│ Tags Browser      │
│📊│ Knowledge Graph   │  ← First-class items
│🔗│ Backlinks         │  ← First-class items
│📅│ Daily Notes       │
└─┴────────────────────┘

Knowledge-first with code progressively revealed
```

### Editor

**Foam:**
- Enhanced markdown (still source view)
- Syntax highlighting for wiki links
- Preview in separate panel

**Our Vision:**
- [[WYSIWYG Markdown Editor]] by default
- Toggle to source mode
- No separate preview needed

### Activity Bar

**Foam:**
- One "Foam" icon
- All features nested

**Our Vision:**
- Multiple first-class KB items
- Activity bar = knowledge navigation
- More like Obsidian's ribbon

## Compatibility

**Important:** Our project should be compatible with Foam vaults!

Both use:
- File-system based (not database)
- Markdown files with wiki links
- Same `[[Link]]` syntax
- Same frontmatter format

Users should be able to:
- Open Foam vault in our IDE
- Open our vault in VS Code + Foam
- Sync between them

## Integration Strategy

**Updated approach:** Extract and implement algorithms ourselves

```typescript
// Our own implementation, inspired by Foam
export class WikiLinkParser {
  // Extract regex and logic from foam-core
  parseWikiLinks(content: string): WikiLink[] {
    // Implementation based on Foam's algorithm
    const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
    // ... our implementation
  }
}

export class KnowledgeGraphWidget extends ReactWidget {
  async buildGraph(): Promise<void> {
    // Our own graph builder, using algorithms learned from Foam
    const graph = await this.graphService.createGraph()

    // Render with our custom UI
    this.renderGraph(graph)
  }
}
```

**Process:**
1. Study foam-core source code
2. Extract key algorithms (wiki link parsing, graph building)
3. Re-implement in our codebase
4. Customize for our needs

## What We Do Better

| Feature | Foam | Our Vision |
|---------|------|------------|
| **UI** | Code-first | Knowledge-first |
| **Editor** | Source | WYSIWYG |
| **Activity Bar** | One icon | Multiple first-class |
| **Progressive Disclosure** | No | Yes! |
| **Onboarding** | For devs | For everyone |

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Wiki Links]]
- [[Backlinks Panel]]
- [[Knowledge Graph View]]
- [[Obsidian-Like Experience]]
- [[Progressive Disclosure Pattern]]
