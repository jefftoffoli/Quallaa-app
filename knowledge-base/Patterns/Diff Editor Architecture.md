# Diff Editor Architecture

## What It Is

The **Diff Editor** shows two files side-by-side for comparison (like git diff).

**Key Insight:** It's ONE widget that contains TWO editors inside!

## Physical Metaphor

**Museum Diptych Display Case** - One frame holding two paintings side-by-side

```
┌─────────────────────────────────────┐
│  MonacoDiffEditor (ONE widget)      │
│  ┌──────────────┬──────────────┐   │
│  │  Original    │  Modified    │   │  ← Two editors inside
│  │  (left)      │  (right)     │   │
│  └──────────────┴──────────────┘   │
└─────────────────────────────────────┘

From shell's perspective: Just one widget
Internally: Monaco manages two editors
```

## vs Markdown Preview

**Diff Editor:**
- ONE widget added to shell
- Monaco manages internal split
- Uses special `diff://` URI scheme

**Markdown Preview:**
- TWO separate widgets
- Shell manages the split
- Uses query parameter `?open-handler=...`

See: [[Two-Widget vs Composite Widget Architecture]]

## The Diff URI Trick

See: [[Diff URI Encoding]]

```typescript
// Encode two files into one URI
const diffUri = DiffUris.encode(
  new URI('file:///old.js'),
  new URI('file:///new.js'),
  'old.js ↔ new.js'  // Label
)

// Result:
// diff://old.js ↔ new.js?["file:///old.js","file:///new.js"]
```

## Detection and Routing

```typescript
// monaco-editor-provider.ts
protected createEditor(uri: URI): Promise<MonacoEditor> {
  if (DiffUris.isDiffUri(uri)) {  // ← Check scheme
    return this.createMonacoDiffEditor(uri)  // ← Special path
  }
  return this.createMonacoEditor(uri)  // ← Regular editor
}
```

## Creating the Diff Editor

```typescript
protected async createMonacoDiffEditor(uri: URI): Promise<MonacoDiffEditor> {
  // 1. Decode the diff URI
  const [original, modified] = DiffUris.decode(uri)

  // 2. Load both file models
  const [originalModel, modifiedModel] = await Promise.all([
    this.getModel(original),
    this.getModel(modified)
  ])

  // 3. Create diff editor widget
  const editor = new MonacoDiffEditor(
    uri,
    document.createElement('div'),
    originalModel,   // ← Left side
    modifiedModel,   // ← Right side
    this.services,
    this.diffNavigatorFactory,
    options
  )

  return editor
}
```

## Monaco's Internal Magic

See: [[Monaco Diff Editor Implementation]]

Monaco's `StandaloneDiffEditor2` internally:
- Creates two separate editors (original, modified)
- Calculates diff between them
- Renders side-by-side with highlights
- Synchronizes scrolling
- Shows line change indicators

```typescript
// Inside MonacoDiffEditor
protected override create(): Disposable {
  this._diffEditor = instantiator.createInstance(
    StandaloneDiffEditor2,  // ← Monaco's diff renderer
    this.node,
    options
  )

  // Tell Monaco about both models
  this._diffEditor.setModel({
    original: this.originalTextModel,
    modified: this.modifiedTextModel
  })

  return this._diffEditor
}
```

## Key Files

```
@theia/core/lib/browser/diff-uris.js
  ├─ encode() - Create diff URI
  ├─ decode() - Extract original URIs
  └─ isDiffUri() - Check if URI is diff

@theia/monaco/src/browser/monaco-diff-editor.ts
  ├─ MonacoDiffEditor class
  ├─ Wraps Monaco's IStandaloneDiffEditor
  └─ Manages two models

@theia/monaco/src/browser/monaco-editor-provider.ts
  ├─ Detects diff URIs
  ├─ Routes to diff editor creation
  └─ createMonacoDiffEditor()
```

## Why This Pattern?

**Benefits:**
- ✅ One tab in shell (not two)
- ✅ Monaco handles complex diff logic
- ✅ Built-in change navigation
- ✅ Synchronized scrolling
- ✅ Professional diff highlighting

**When to Use:**
- Views are ALWAYS shown together
- Monaco provides built-in support
- Need line-by-line comparison
- Single unified view makes sense

## Comparison to Our Project

We explored using this pattern for [[WYSIWYG Markdown Editor]], but decided against it because:

- Markdown editor + preview are conceptually separate
- Users might want flexibility in layout
- Preview is optional, not always needed
- Easier to reuse existing editor infrastructure

See: [[Two-Widget vs Composite Widget Architecture]]

## Related Concepts

- [[Diff URI Encoding]]
- [[Monaco Diff Editor Implementation]]
- [[URI Schemes in Theia]]
- [[Composite vs Separate Widget Patterns]]
- [[Markdown Preview Implementation]]
