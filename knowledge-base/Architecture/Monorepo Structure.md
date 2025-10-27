# Monorepo Structure

## What It Is

**Monorepo** = Single repository containing multiple packages

Theia uses a monorepo with Lerna + Yarn Workspaces.

## Physical Metaphor

**Shopping Mall**

```
Single building (repo) with many stores (packages):

mall/
├── clothing-store/
├── electronics-store/
├── food-court/
└── parking/

Each store is independent,
but they share infrastructure (building, utilities).

Similarly:
theia/
├── @theia/core/
├── @theia/monaco/
├── @theia/navigator/
└── @theia/filesystem/
```

## Theia's Structure

```
theia/
├── packages/              ← All packages here
│   ├── core/
│   │   ├── src/
│   │   └── package.json
│   ├── monaco/
│   │   ├── src/
│   │   └── package.json
│   ├── navigator/
│   └── ...
├── lerna.json            ← Lerna config
├── package.json          ← Root package.json
└── yarn.lock
```

### Packages

Each folder in `packages/` is an npm package:

```
@theia/core         → Core framework
@theia/monaco       → Monaco editor integration
@theia/navigator    → File explorer
@theia/filesystem   → File system abstraction
@theia/workspace    → Workspace management
@theia/git          → Git integration
@theia/debug        → Debug support
... 50+ more
```

## Package Dependencies

### Inter-Package Dependencies

Packages depend on each other:

```json
// packages/navigator/package.json
{
  "name": "@theia/navigator",
  "dependencies": {
    "@theia/core": "1.0.0",
    "@theia/filesystem": "1.0.0"
  }
}
```

### Yarn Workspaces

```json
// Root package.json
{
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

Yarn creates symlinks so packages can `require()` each other locally.

## Our Project Structure

### Option 1: Fork Entire Theia

```
quallaa-app/
├── packages/
│   ├── core/              ← Theia core (unchanged)
│   ├── monaco/            ← Theia monaco (unchanged)
│   ├── ...
│   ├── knowledge-base/    ← OUR NEW PACKAGE!
│   │   ├── src/
│   │   │   ├── browser/
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── notes-widget.ts
│   │   │   │   │   ├── graph-widget.ts
│   │   │   │   │   └── ...
│   │   │   │   ├── services/
│   │   │   │   └── knowledge-base-frontend-module.ts
│   │   │   ├── node/
│   │   │   │   ├── note-indexer.ts
│   │   │   │   └── knowledge-base-backend-module.ts
│   │   │   └── common/
│   │   └── package.json
│   └── application/       ← Modified to use our customizations
└── ...
```

### Option 2: Separate Extension Package

```
quallaa-app/
├── package.json
└── extensions/
    └── knowledge-base/
        ├── src/
        └── package.json
```

Then reference Theia as npm dependencies.

### Recommended: Option 1 (Fork)

Since we're customizing deeply (activity bar, WYSIWYG, etc.), fork is better.

## Creating Our Package

### package.json

```json
{
  "name": "@quallaa/knowledge-base",
  "version": "0.1.0",
  "description": "Knowledge-first IDE features",
  "dependencies": {
    "@theia/core": "1.52.0",
    "@theia/filesystem": "1.52.0",
    "@theia/workspace": "1.52.0",
    "@theia/monaco": "1.52.0",
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "d3": "^7.8.5"
  },
  "theiaExtensions": [
    {
      "frontend": "lib/browser/knowledge-base-frontend-module",
      "backend": "lib/node/knowledge-base-backend-module"
    }
  ],
  "scripts": {
    "build": "tsc"
  },
  "files": [
    "lib",
    "src"
  ]
}
```

### Frontend Module

```typescript
// src/browser/knowledge-base-frontend-module.ts

import { ContainerModule } from '@theia/core/shared/inversify'

export default new ContainerModule(bind => {
  // Bind widgets
  bind(NotesWidget).toSelf().inSingletonScope()
  bind(GraphWidget).toSelf().inSingletonScope()
  bind(BacklinksWidget).toSelf().inSingletonScope()

  // Bind services
  bind(WikiLinkParser).toSelf().inSingletonScope()
  bind(TagIndexService).toSelf().inSingletonScope()

  // Bind contributions
  bind(ActivityBarContribution).to(KnowledgeActivityBarContribution).inSingletonScope()
  bind(OpenHandler).to(MarkdownEditorOpenHandler).inSingletonScope()
})
```

### Backend Module

```typescript
// src/node/knowledge-base-backend-module.ts

import { ContainerModule } from '@theia/core/shared/inversify'
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core'

export default new ContainerModule(bind => {
  // Backend services
  bind(NoteIndexBackend).toSelf().inSingletonScope()

  // Expose via RPC
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new JsonRpcConnectionHandler(NOTE_INDEX_PATH, () => {
      return ctx.container.get(NoteIndexBackend)
    })
  ).inSingletonScope()
})
```

## Application Package

```
packages/application/
├── package.json          ← Depends on all packages
├── src-gen/              ← Generated code
└── lib/                  ← Compiled code
```

### package.json

```json
{
  "name": "@quallaa/application",
  "dependencies": {
    "@theia/core": "1.52.0",
    "@theia/monaco": "1.52.0",
    "@theia/filesystem": "1.52.0",
    "@quallaa/knowledge-base": "0.1.0"   ← Our package!
  },
  "scripts": {
    "prepare": "yarn build",
    "build": "theia build --app-target=\"electron\"",
    "start": "theia start",
    "watch": "theia build --watch"
  }
}
```

## Build Process

### TypeScript Compilation

Each package compiles independently:

```bash
# In packages/knowledge-base/
tsc

# Output to lib/
packages/knowledge-base/
├── src/
│   └── browser/
│       └── notes-widget.ts
└── lib/                    ← Compiled
    └── browser/
        └── notes-widget.js
```

### Lerna

```bash
# Build all packages
lerna run build

# Build in dependency order
lerna run build --stream
```

### Webpack

Application package uses webpack to bundle:

```bash
# In packages/application/
theia build

# Creates:
src-gen/frontend/  ← Bundled frontend code
src-gen/backend/   ← Bundled backend code
```

## Development Workflow

### Watch Mode

```bash
# Watch all packages
yarn watch

# Or specific package
cd packages/knowledge-base && yarn watch
```

### Link Changes

Yarn workspaces automatically link:

```
Edit: packages/knowledge-base/src/widgets/notes-widget.ts
  ↓
Compiles to: packages/knowledge-base/lib/widgets/notes-widget.js
  ↓
Linked to: packages/application/node_modules/@quallaa/knowledge-base/lib/...
  ↓
Refresh browser → See changes!
```

### Electron vs Browser

```bash
# Electron app
yarn start:electron

# Browser app
yarn start:browser
```

## Versioning

### Lerna Version

```bash
# Bump all package versions together
lerna version 0.2.0

# Creates git tag + commit
```

### Independent Versions

Or use independent versioning:

```json
// lerna.json
{
  "version": "independent",
  "packages": ["packages/*"]
}
```

Each package can have different version.

## Benefits of Monorepo

### 1. Atomic Changes

```
Change API in @theia/core
Update all consumers in same commit
Test everything together
```

### 2. Code Sharing

```
Share utilities across packages:
packages/shared-utils/
└── src/
    ├── markdown-parser.ts
    └── uri-helpers.ts

Used by:
- @quallaa/knowledge-base
- @quallaa/wysiwyg-editor
- @quallaa/graph-view
```

### 3. Consistent Dependencies

```
All packages use same version of React, Monaco, etc.
Defined in root package.json
```

## Challenges

### Build Time

More packages = longer build:

```bash
# Cache compiled output
yarn build --cache

# Incremental builds
yarn watch
```

### Dependency Cycles

```
Avoid:
@quallaa/a → depends on → @quallaa/b
@quallaa/b → depends on → @quallaa/a

❌ Circular dependency!
```

## Related Concepts

- [[Dependency Injection in Theia]]
- [[Frontend and Backend Communication]]
- [[Next.js vs Theia Architecture]]
- [[Project Vision - Knowledge-First IDE]]
