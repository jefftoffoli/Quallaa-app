# Quallaa

**A Knowledge-First IDE for Natural Language Developers**

Quallaa is a proprietary IDE that puts knowledge management first, with code execution capabilities progressively disclosed as needed. Built as a fork of Eclipse Theia, it combines the knowledge graph experience of Obsidian with the full power of a modern IDE.

## Vision

Traditional IDEs assume you're writing code. Quallaa assumes you're building a knowledge base that happens to be executable.

**Target Users:**
- Natural language developers who think in markdown
- AI-assisted coders
- Technical writers
- Researchers and data scientists

**Key Features (Planned):**
- Wiki-style linking with backlinks
- Knowledge graph visualization
- WYSIWYG markdown editor
- Daily notes system
- Progressive disclosure of IDE features
- Full debugging, git, and terminal capabilities

## Architecture

Quallaa is built on Eclipse Theia, leveraging its:
- Modular, extensible architecture
- Web and desktop (Electron) support
- Professional VS Code-like editing experience
- Active development and maintenance

This is a fork, not an extension, giving us complete control over the UI/UX and default behaviors.

## Development

### Prerequisites

See [Theia's prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites).

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
  - `product/` - Branding and product identity
  - `updater/` - Auto-update mechanism
  - `launcher/` - CLI launcher for AppImage builds
- `knowledge-base/` - Project documentation and architecture notes

## License

Copyright (c) 2025 Jeff Toffoli. All Rights Reserved.

This is proprietary software. See [LICENSE](LICENSE) for details.

Quallaa is based on Eclipse Theia, which is licensed under the Eclipse Public License 2.0. Theia platform components retain their original license. All Quallaa-specific modifications and extensions are proprietary.

---

*"Where knowledge becomes executable"*
