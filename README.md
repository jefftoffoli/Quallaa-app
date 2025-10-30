# Quallaa

**A Knowledge-First IDE for Natural Language Developers**

Quallaa is a proprietary IDE that puts knowledge management first, with code
execution capabilities progressively disclosed as needed. Built as a fork of
Eclipse Theia, it combines the knowledge graph experience of Obsidian with the
full power of a modern IDE.

## Vision

Traditional IDEs assume you're writing code. Quallaa assumes you're building a
knowledge base that happens to be executable.

**Target Users:**

- Natural language developers who think in markdown
- AI-assisted coders
- Technical writers
- Researchers and data scientists

**Key Features:**

- ✅ Wiki-style linking with backlinks
- ✅ Interactive knowledge graph visualization (D3.js force-directed)
- ✅ Hierarchical tags browser with real-time filtering
- ✅ Note templates with variable substitution
- ✅ Daily notes system
- 🚧 WYSIWYG markdown editor (planned)
- ✅ Progressive disclosure of IDE features
- ✅ Full debugging, git, and terminal capabilities

## Architecture

Quallaa is built on Eclipse Theia, leveraging its:

- Modular, extensible architecture
- Web and desktop (Electron) support
- Professional VS Code-like editing experience
- Active development and maintenance

This is a fork, not an extension, giving us complete control over the UI/UX and
default behaviors.

## Knowledge Base Extension

Quallaa's Knowledge Base extension achieves **87.5% feature parity with Foam**,
implementing 7 of 8 core knowledge management features:

### ✅ Implemented Features

**Knowledge Graph**

- Interactive D3.js force-directed graph visualization
- Zoom, pan, and drag node interactions
- Visual indicators for active notes vs. unresolved links
- Node sizing based on connection count (degree centrality)
- Click to open notes directly from graph
- Summary stats: note count, link count, orphans

**Tags Browser**

- Hierarchical tag display with expand/collapse
- Support for nested tags (e.g., `project/backend/api`)
- Real-time filtering: click tag to view associated notes
- Badge counts showing notes per tag
- Sorted by frequency and alphabetically

**Note Templates**

- 5 default templates: Blank, Meeting Notes, Project Note, Research Note, Daily
  Log
- 13 Foam-compatible template variables (date, time, title, etc.)
- Command: "Knowledge Base: Create Note from Template"
- Interactive workflow with template picker and title input
- Automatic filename slugification

**Wiki Links**

- Double-bracket syntax: `[[Note Name]]`
- Automatic link detection and navigation
- Support for aliases: `[[Note Name|Display Text]]`
- Unresolved link tracking

**Backlinks**

- Automatic bidirectional link detection
- View all notes linking to current note
- Click to navigate to source note

**Daily Notes**

- Automatic daily note creation with date-based naming
- Configurable template support
- Quick access via command palette

### 🚧 Remaining Features

**Orphans Detection** (Planned)

- Identify notes with no incoming or outgoing links
- Dedicated orphans browser widget

## Development

### Prerequisites

See
[Theia's prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites).

Requirements:

- Node.js >= 20
- Yarn >= 1.7.0 < 2

### Building

Development build (faster, uses less resources):

```sh
yarn && yarn build:dev && yarn download:plugins
```

Production build:

```sh
yarn && yarn build && yarn download:plugins
```

### Running

Browser version:

```sh
yarn browser start
# Visit http://localhost:3000/
```

Electron preview:

```sh
yarn electron package:preview
```

Package installers:

```sh
yarn package:applications
# Output in applications/electron/dist
```

### Repository Structure

- `applications/` - Browser and Electron app targets
- `theia-extensions/` - Custom Theia extensions for Quallaa
    - `knowledge-base/` - Knowledge management extension (wiki links, graph,
      tags, templates)
    - `product/` - Branding and product identity
    - `updater/` - Auto-update mechanism
    - `launcher/` - CLI launcher for AppImage builds
- `knowledge-base/` - Project documentation and architecture notes

## License

Copyright (c) 2025 Jeff Toffoli

Quallaa is open source software licensed under the
[Eclipse Public License 2.0](LICENSE) (EPL-2.0).

This project is a fork of Eclipse Theia, which is also licensed under EPL-2.0.
Both the original Theia components and Quallaa-specific modifications are
available under the same EPL-2.0 license, enabling both open source and
commercial use.

See [LICENSE](LICENSE) for full license text.

---

_"Where knowledge becomes executable"_
