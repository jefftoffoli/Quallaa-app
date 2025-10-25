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
│       │   ├── model/
│       │   │   ├── note.ts      # ← Can reuse!
│       │   │   ├── graph.ts     # ← Can reuse!
│       │   │   └─ wikilink.ts  # ← Can reuse!
│       │   └── services/
│       │       ├── parser.ts    # ← Can reuse!
│       │       └── linker.ts    # ← Can reuse!
│       └── package.json
```

**Key Insight:** `foam-core` is platform-independent! We can use it:

```bash
npm install --save @foamhq/foam-core
```

## What to Take from Foam

✅ **Wiki link parsing logic** (use foam-core)
✅ **Graph data structure** (use foam-core)
✅ **Backlink detection algorithm** (use foam-core)
✅ **Note metadata extraction**
✅ **Link reference system**

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

```typescript
// Use Foam's core logic
import { createGraph, parseWikiLinks } from '@foamhq/foam-core'

// Build our UI on top
export class KnowledgeGraphWidget extends ReactWidget {
  async buildGraph(): Promise<void> {
    // Use Foam's graph builder
    const graph = await createGraph(this.workspace)

    // Render with our custom UI
    this.renderGraph(graph)
  }
}
```

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
