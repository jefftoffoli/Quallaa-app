# Extension Structure Decision

**Decision:** ✅ Create new `theia-extensions/knowledge-base` package. See [[Decisions Summary]].

## Structure

```
theia-extensions/knowledge-base/
├── package.json
├── src/
│   ├── browser/         # Wiki links, widgets, UI
│   ├── node/            # Indexing, file watching
│   └── common/          # Shared types and protocols
└── README.md
```

## Why New Package

- Cohesive feature set (wiki links, backlinks, graph, tags, quick switcher)
- Substantial scope (10+ services, multiple widgets)
- Could publish independently as `@quallaa/knowledge-base`
- Follows Theia patterns (like `@theia/navigator`, `@theia/git`)

## Phase-by-Phase Build

**Phase 1.2:** Wiki links basics
```
src/browser/wiki-links/
  ├── completion-provider.ts
  ├── link-detector.ts
  └── link-navigator.ts
```

**Phase 2:** Add backlinks, tags
```
src/browser/
  ├── wiki-links/
  ├── backlinks/
  └── tags/
```

**Phase 4:** Add graph
```
src/browser/
  ├── wiki-links/
  ├── backlinks/
  ├── tags/
  └── graph/
```

## Setup Commands (Phase 1.2 Start)

```bash
# 1. Create structure
mkdir -p theia-extensions/knowledge-base/src/{browser,node,common}
cd theia-extensions/knowledge-base

# 2. Create package.json
cat > package.json << 'EOF'
{
  "name": "@quallaa/knowledge-base",
  "version": "0.1.0",
  "license": "EPL-2.0",
  "dependencies": {
    "@theia/core": "latest",
    "@theia/filesystem": "latest",
    "@theia/monaco": "latest",
    "@theia/workspace": "latest"
  },
  "theiaExtensions": [{
    "frontend": "lib/browser/knowledge-base-frontend-module",
    "backend": "lib/node/knowledge-base-backend-module"
  }]
}
EOF

# 3. Create tsconfig
cat > tsconfig.json << 'EOF'
{
  "extends": "../../configs/base.tsconfig",
  "compilerOptions": {"rootDir": "src", "outDir": "lib"},
  "include": ["src"]
}
EOF

# 4. Create stub modules
mkdir -p src/{browser,node}
echo "import { ContainerModule } from '@theia/core/shared/inversify';" > src/browser/knowledge-base-frontend-module.ts
echo "export default new ContainerModule(bind => {});" >> src/browser/knowledge-base-frontend-module.ts

# 5. Register in applications/*/package.json
# Add: "@quallaa/knowledge-base": "0.1.0" to dependencies

# 6. Build from repo root
yarn && yarn build
```

---

**Decision:** ✅ Create new package. **Status:** Ready for Phase 1.2.
