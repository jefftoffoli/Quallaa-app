# Composite vs Separate Widget Patterns

## What It Is

**Two approaches for combining multiple views:**

1. **Composite Widget:** Single widget containing multiple sub-components internally
2. **Separate Widgets:** Multiple independent widgets managed by shell

## Physical Metaphor

### Composite Widget

**Swiss Army Knife**

```
One tool with multiple blades:
┌─────────────────┐
│ [🔪 🔩 🍷 ✂️ ]   │ ← All parts in one unit
└─────────────────┘

Can't separate the tools.
Managed as single unit.
```

### Separate Widgets

**Toolbox**

```
Multiple separate tools:
┌─────────────────┐
│ 🔨 Hammer       │ ← Individual tools
├─────────────────┤
│ 🔩 Wrench       │ ← Can remove/rearrange
├─────────────────┤
│ 🪛 Screwdriver  │ ← Independently managed
└─────────────────┘
```

## Examples in Theia

### Composite: Diff Editor

See: [[Diff Editor Architecture]]

```typescript
export class MonacoDiffEditor {
  protected original: monaco.editor.IStandaloneCodeEditor
  protected modified: monaco.editor.IStandaloneCodeEditor

  // ONE widget, TWO editors inside
  create(): void {
    this.diffEditor = monaco.editor.createDiffEditor(this.node, {
      // ...
    })

    this.diffEditor.setModel({
      original: this.originalModel,
      modified: this.modifiedModel
    })
  }
}
```

**Characteristics:**
- Single widget ID
- One tab in main area
- Can't separate the two editors
- Internal layout managed by widget

### Separate: Markdown Preview

```typescript
// Two independent widgets:
1. Monaco editor (source)
2. Preview widget (rendered)

// Application shell manages both:
shell.addWidget(editorWidget, { area: 'main' })
shell.addWidget(previewWidget, { area: 'main', mode: 'split-right' })
```

**Characteristics:**
- Two widget IDs
- Two tabs (or side-by-side)
- Can close one, keep other
- Shell manages layout

## Trade-offs

### Composite Widget

**Pros:**
- ✅ Simpler state management (one widget, one state)
- ✅ Guaranteed synchronization (everything in one object)
- ✅ Single open/close operation
- ✅ Custom layout control

**Cons:**
- ❌ Less flexible (can't rearrange parts)
- ❌ Can't close sub-parts independently
- ❌ Harder to reuse components
- ❌ More complex widget code

### Separate Widgets

**Pros:**
- ✅ Flexible (user can rearrange)
- ✅ Independent lifecycle (close one, keep other)
- ✅ Reusable components
- ✅ Simpler individual widgets

**Cons:**
- ❌ Synchronization required
- ❌ More state to manage
- ❌ Multiple tabs/panes
- ❌ Shell layout constraints

## When to Use Each

### Use Composite When:

1. **Views are tightly coupled**
   ```
   Diff editor: Original and modified are inherently linked
   ```

2. **Custom layout needed**
   ```
   Side-by-side comparison with custom splitter
   ```

3. **Single conceptual unit**
   ```
   User thinks of it as "one thing"
   ```

4. **Always shown together**
   ```
   No use case for showing only one part
   ```

### Use Separate When:

1. **Views can be independent**
   ```
   Editor and terminal: Often used separately
   ```

2. **User wants flexibility**
   ```
   "I want preview on right, editor on left"
   "Actually, I want them in tabs"
   ```

3. **Components are reusable**
   ```
   Same editor widget used elsewhere
   ```

4. **Optional views**
   ```
   "Show preview" vs "Hide preview"
   ```

## Our Use Cases

### Markdown Editor: Which Approach?

See: [[WYSIWYG Markdown Editor]]

**Option A: Composite**
```typescript
export class MarkdownEditorWidget extends BaseWidget {
  protected wysiwygView: TipTapEditor
  protected sourceView: MonacoEditor
  protected currentMode: 'wysiwyg' | 'source'

  toggleMode(): void {
    if (this.currentMode === 'wysiwyg') {
      this.wysiwygView.hide()
      this.sourceView.show()
      this.syncToSource()
    } else {
      this.sourceView.hide()
      this.wysiwygView.show()
      this.syncToWYSIWYG()
    }
  }
}
```

**Characteristics:**
- Single tab: "note.md"
- Toggle button switches views
- Guaranteed sync (same widget)
- Simpler for user

**Recommendation:** ✅ Use composite for WYSIWYG/Source toggle

### Graph + Backlinks: Which Approach?

**Option A: Composite**
```typescript
export class KnowledgeViewWidget extends BaseWidget {
  protected graphPanel: GraphView
  protected backlinksPanel: BacklinksView

  // Split view showing both
}
```

**Option B: Separate**
```typescript
// Two different activity bar items:
📊 Graph View
🔗 Backlinks

// User chooses which to show
```

**Recommendation:** ✅ Use separate (user may want only one)

### Notes List + Preview: Which Approach?

**Option A: Composite**
```typescript
export class NotesExplorerWidget extends BaseWidget {
  protected notesList: TreeWidget
  protected preview: PreviewPanel

  // Click note → Preview updates
}
```

**Option B: Separate**
```typescript
// Left sidebar: Notes list
// Main area: Full editor when clicked
```

**Recommendation:** ✅ Use separate (Obsidian-like behavior)

## Implementation Patterns

### Composite Widget Template

```typescript
@injectable()
export class CompositeWidget extends BaseWidget {

  protected subWidgetA: WidgetA
  protected subWidgetB: WidgetB
  protected layout: SplitLayout

  @postConstruct()
  protected init(): void {
    this.id = 'composite-widget'
    this.title.label = 'Composite'

    // Create sub-widgets
    this.subWidgetA = new WidgetA()
    this.subWidgetB = new WidgetB()

    // Create layout
    this.layout = new SplitLayout({
      orientation: 'horizontal',
      spacing: 4
    })

    this.layout.addWidget(this.subWidgetA)
    this.layout.addWidget(this.subWidgetB)

    // Synchronize state
    this.subWidgetA.onDidChange(() => {
      this.syncBtoA()
    })
  }

  protected syncBtoA(): void {
    const state = this.subWidgetA.getState()
    this.subWidgetB.setState(state)
  }
}
```

### Separate Widgets Template

```typescript
@injectable()
export class WidgetAContribution {

  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell

  @inject(WidgetBSync)
  protected readonly sync: WidgetBSync

  async openWidgetA(): Promise<void> {
    const widgetA = await this.widgetManager.getOrCreateWidget('widget-a')

    this.shell.addWidget(widgetA, { area: 'main' })

    // Set up synchronization
    widgetA.onDidChange(state => {
      this.sync.notifyChange('widget-a', state)
    })
  }
}

@injectable()
export class WidgetBContribution {
  // Similar, listens to sync service
}

@injectable()
export class WidgetBSync {
  private emitter = new Emitter<{ source: string, state: any }>()

  notifyChange(source: string, state: any): void {
    this.emitter.fire({ source, state })
  }

  onDidChange = this.emitter.event
}
```

## Hybrid Approach

Sometimes best to combine both:

```typescript
// Composite widget for tightly-coupled parts
export class MarkdownEditorWidget {
  protected wysiwyg: WYSIWYGView
  protected source: SourceView
  // Toggle between these
}

// Separate widgets for optional parts
shell.addWidget(markdownEditor, { area: 'main' })

if (user.wantsPreview) {
  shell.addWidget(preview, { area: 'right' })
}

if (user.wantsOutline) {
  shell.addWidget(outline, { area: 'right' })
}
```

## Obsidian Comparison

**Obsidian:**
- Editor: Composite (WYSIWYG ↔ Source toggle in same pane)
- Sidebars: Separate (each panel is independent)
- Splits: Separate (user can arrange freely)

**Our Implementation:**
- Same approach as Obsidian
- Composite for mode toggling
- Separate for user-arrangeable panels

## Related Concepts

- [[Diff Editor Architecture]]
- [[WYSIWYG Markdown Editor]]
- [[Widget System]]
- [[Theia Application Shell]]
- [[View Containers]]
