# Activity Bar

## What It Is

**Activity Bar** = Vertical strip of icons on the left (or right) side of the window that lets users switch between different panels

## Physical Metaphor

**TV Remote Control**

```
Each button switches to a different channel:
📺 [1] → News
📺 [2] → Sports
📺 [3] → Movies

Each icon switches to a different panel:
🖥️ [📚] → Notes
🖥️ [🏷️] → Tags
🖥️ [📊] → Graph
```

## Location in Code

**Rendering:** `node_modules/@theia/core/src/browser/shell/side-panel-toolbar.ts`
**Management:** `node_modules/@theia/core/src/browser/shell/side-panel-handler.ts`

## Visual Structure

### Standard Theia Activity Bar
```
┌─┐
│📁│ ← Explorer (rank 100)
├─┤
│🔍│ ← Search (rank 200)
├─┤
│⎇ │ ← Source Control (rank 300)
├─┤
│🧩│ ← Extensions (rank 400)
└─┘
```

### Our Knowledge-First Activity Bar
```
┌─┐
│📚│ ← Notes Library (rank 50) - FIRST!
├─┤
│🏷️│ ← Tags Browser (rank 60)
├─┤
│📊│ ← Knowledge Graph (rank 70)
├─┤
│🔗│ ← Backlinks (rank 80)
├─┤
│📁│ ← Files (rank 500) - Revealed later
├─┤
│⎇ │ ← Git (rank 600) - Revealed for advanced
└─┘
```

## How It Works

### 1. Icon Registration

Each panel registers an icon via [[Side Panel Handlers]]:

```typescript
sidePanelHandler.register(widget, {
  rank: 50,              // Position in Activity Bar
  iconClass: 'fa fa-book',  // Font Awesome icon
  title: 'Notes Library'    // Tooltip on hover
})
```

### 2. Rank-Based Ordering

Icons are sorted by rank (lowest first):

```typescript
const sorted = items.sort((a, b) => a.rank - b.rank)
```

### 3. Click Handling

```typescript
onClick(iconId: string): void {
  // Hide current panel
  currentPanel?.hide()

  // Show clicked panel
  const panel = panels.get(iconId)
  panel?.show()

  // Update active state
  updateActiveIcon(iconId)
}
```

### 4. Active State

Currently selected icon gets highlighted:

```css
.activity-bar-item.active {
  background-color: var(--theia-activityBar-activeBorder);
  border-left: 2px solid var(--theia-activityBar-activeBorder);
}
```

## Customization Options

### Icon Types

**Font Awesome:**
```typescript
iconClass: 'fa fa-book'
```

**Codicons (VS Code icons):**
```typescript
iconClass: 'codicon codicon-graph'
```

**Custom SVG:**
```typescript
iconClass: 'custom-knowledge-graph-icon'
// Define in CSS with background-image
```

### Icon with Badge

```typescript
// Show number of unread items
<div class="activity-bar-item">
  <i class="fa fa-book"></i>
  <span class="badge">5</span>
</div>
```

### Conditional Visibility

```typescript
// Only show icon if panel should be visible
if (progressiveDisclosure.shouldShow('file-explorer')) {
  registerActivityBarIcon(fileExplorerWidget)
}
```

## Progressive Disclosure

See: [[Progressive Disclosure Pattern]]

Activity Bar changes as user advances:

**Day 1 (Beginner):**
```
┌─┐
│📚│ Notes
│🏷️│ Tags
│📊│ Graph
│🔗│ Backlinks
└─┘
```

**Week 2 (Intermediate):**
```
┌─┐
│📚│ Notes
│🏷️│ Tags
│📊│ Graph
│🔗│ Backlinks
├─┤
│📁│ Files ← NEW! Revealed
└─┘
```

**Month 1 (Advanced):**
```
┌─┐
│📚│ Notes
│🏷️│ Tags
│📊│ Graph
│🔗│ Backlinks
├─┤
│📁│ Files
│🔍│ Search
│⎇ │ Git
│🐛│ Debug
└─┘
```

## Left vs Right Activity Bars

Theia supports activity bars on both sides:

```
┌─┬────────────────┬─┐
│📚│                │📋│ ← Right Activity Bar
│🏷️│     Main       │  │
│📊│     Area       │  │
│🔗│                │  │
└─┴────────────────┴─┘
 ↑
Left Activity Bar
```

**Left:** Primary navigation (knowledge, files, git)
**Right:** Contextual panels (preview, outline, properties)

## Obsidian Comparison

**Obsidian's "Ribbon"** = Theia's Activity Bar

```
Obsidian:                 Our Theia:
┌─┐                       ┌─┐
│📁│ Files                │📚│ Notes
│🔍│ Search               │🏷️│ Tags
│📊│ Graph                │📊│ Graph
│📅│ Calendar             │🔗│ Backlinks
│⭐│ Starred              │📅│ Daily Notes
└─┘                       └─┘
```

We aim for similar first-class knowledge features.

## Implementation Code

```typescript
@injectable()
export class CustomActivityBarContribution implements FrontendApplicationContribution {

  @inject(LeftPanelHandler)
  protected readonly leftPanelHandler: LeftPanelHandler

  async onStart(): Promise<void> {
    // Register knowledge-first icons
    await this.registerKnowledgeIcons()

    // Register IDE icons (for later revelation)
    await this.registerIDEIcons()
  }

  protected async registerKnowledgeIcons(): Promise<void> {
    const notesWidget = await this.widgetManager.getOrCreateWidget(NOTES_WIDGET_ID)
    this.leftPanelHandler.register(notesWidget, {
      rank: 50,
      iconClass: 'fa fa-book',
      title: 'Notes Library'
    })

    // ... register other knowledge icons
  }

  protected async registerIDEIcons(): Promise<void> {
    // Only if user level permits
    if (!this.shouldShowIDEFeatures()) {
      return
    }

    const explorerWidget = await this.widgetManager.getOrCreateWidget(EXPLORER_WIDGET_ID)
    this.leftPanelHandler.register(explorerWidget, {
      rank: 500,
      iconClass: 'fa fa-folder',
      title: 'File Explorer'
    })
  }
}
```

## Related Concepts

- [[Side Panel Handlers]]
- [[View Containers]]
- [[Progressive Disclosure Pattern]]
- [[Rank and Priority in Side Panels]]
- [[Project Vision - Knowledge-First IDE]]
- [[Obsidian-Like Experience]]
