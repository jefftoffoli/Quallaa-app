# Side Panel Handlers

## What They Are

**Side Panel Handlers** = Service that manages left and right side panels in Theia, including the Activity Bar icons

## Physical Metaphor

**Museum Curator**

```
The curator decides:
- Which exhibits are available (Activity Bar icons)
- Which exhibit is currently showing (active panel)
- What order exhibits appear (rank)
- Whether exhibits are visible or hidden
```

## Location in Code

**File:** `node_modules/@theia/core/src/browser/shell/side-panel-handler.ts`

## How It Works

### 1. Registering Panels

```typescript
@injectable()
export class SidePanelHandler {

  // Register a widget to appear in side panel
  register(widget: Widget, options: {
    rank?: number           // Order in Activity Bar
    iconClass?: string      // Icon to show
    title?: string          // Tooltip text
  }): void {

    this.items.set(widget.id, {
      widget,
      rank: options.rank ?? 100,
      iconClass: options.iconClass,
      title: options.title
    })

    this.updateToolbar()
  }
}
```

### 2. Rank Property

**Rank determines Activity Bar order:**

```typescript
// Lower rank = higher in Activity Bar

Explorer: rank = 100        // Top
Search: rank = 200          // Second
Source Control: rank = 300  // Third
Extensions: rank = 400      // Fourth
```

**Our custom panels:**

```typescript
// Knowledge panels should be FIRST
Notes Library: rank = 50    // Above Explorer!
Tags: rank = 60
Knowledge Graph: rank = 70
Backlinks: rank = 80

// Traditional IDE panels lower
File Explorer: rank = 500   // Revealed later
Terminal: rank = 600        // Revealed for advanced users
```

### 3. Activation

```typescript
// When user clicks Activity Bar icon
activatePanel(widgetId: string): void {
  // Hide currently active panel
  const current = this.currentWidget
  if (current) {
    current.hide()
  }

  // Show requested panel
  const widget = this.items.get(widgetId)?.widget
  if (widget) {
    widget.show()
    this.currentWidget = widget
    this.applicationShell.activateWidget(widgetId)
  }
}
```

### 4. Single-Document Mode

**Important:** Side panels use single-document mode

```typescript
// Only ONE panel visible at a time
// No splits, no tabs
// Click different icon → replaces current panel
```

This is different from main area which can split and tab.

## Activity Bar Rendering

**File:** `node_modules/@theia/core/src/browser/shell/side-panel-toolbar.ts`

```typescript
export class SidePanelToolbar extends ReactWidget {

  protected render(): React.ReactNode {
    // Get all registered panels
    const items = this.handler.items

    // Sort by rank
    const sorted = Array.from(items.values())
      .sort((a, b) => a.rank - b.rank)

    // Render icons
    return <div className='theia-activity-bar'>
      {sorted.map(item =>
        <div
          className={`activity-bar-item ${item.active ? 'active' : ''}`}
          onClick={() => this.handler.activatePanel(item.id)}
          title={item.title}
        >
          <i className={item.iconClass} />
        </div>
      )}
    </div>
  }
}
```

## Left vs Right

Theia has **two** side panel handlers:

```
┌─┬────────────────┬─┐
│📚│                │📋│
│🏷️│     Main       │  │
│📊│     Area       │  │
│  │                │  │
└─┴────────────────┴─┘
 ↑                  ↑
Left Handler    Right Handler
```

Each has its own Activity Bar and set of panels.

## Our Project Customization

### Left Side (Knowledge-First)

```typescript
@injectable()
export class KnowledgeSidePanelContribution {

  registerPanels(): void {
    // Notes library - rank 50 (first!)
    this.leftHandler.register(notesWidget, {
      rank: 50,
      iconClass: 'fa fa-book',
      title: 'Notes Library'
    })

    // Tags browser - rank 60
    this.leftHandler.register(tagsWidget, {
      rank: 60,
      iconClass: 'fa fa-tags',
      title: 'Tags'
    })

    // Graph view - rank 70
    this.leftHandler.register(graphWidget, {
      rank: 70,
      iconClass: 'fa fa-project-diagram',
      title: 'Knowledge Graph'
    })

    // Backlinks - rank 80
    this.leftHandler.register(backlinksWidget, {
      rank: 80,
      iconClass: 'fa fa-link',
      title: 'Backlinks'
    })

    // File explorer - rank 500 (hidden initially)
    if (this.progressiveDisclosure.shouldShow('file-explorer')) {
      this.leftHandler.register(explorerWidget, {
        rank: 500,
        iconClass: 'fa fa-folder',
        title: 'Files'
      })
    }
  }
}
```

### Right Side (Contextual Panels)

```typescript
// Preview, outline, etc.
this.rightHandler.register(previewWidget, {
  rank: 100,
  iconClass: 'fa fa-eye',
  title: 'Preview'
})
```

## Progressive Disclosure Integration

```typescript
// Show/hide panels based on user level
updatePanelsForUserLevel(level: UserLevel): void {
  if (level === 'beginner') {
    // Show only knowledge panels
    this.hidePanel('file-explorer')
    this.hidePanel('source-control')
    this.hidePanel('terminal')
  } else if (level === 'advanced') {
    // Reveal IDE features
    this.showPanel('file-explorer')
    this.showPanel('source-control')
  }
}
```

## Related Concepts

- [[Activity Bar]]
- [[View Containers]]
- [[Theia Application Shell]]
- [[Single-Document vs Multiple-Document Mode]]
- [[Rank and Priority in Side Panels]]
- [[Progressive Disclosure Pattern]]
- [[Project Vision - Knowledge-First IDE]]
