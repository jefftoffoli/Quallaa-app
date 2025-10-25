# Rank and Priority in Side Panels

## What It Is

**Rank** = Numerical value that determines display order in the Activity Bar

Lower rank = Higher position (appears first)

## Physical Metaphor

**VIP Line**

```
Concert entrance:
1. VIP Pass (rank 1)      ← First in line
2. Early Bird (rank 50)   ← Second
3. General (rank 100)     ← Third
4. Late (rank 500)        ← Last

Lower number = Better position
```

## How It Works

### Default Theia

```typescript
// Standard Activity Bar items

Explorer: rank = 100       // Top
Search: rank = 200         // Second
Source Control: rank = 300 // Third
Extensions: rank = 400     // Fourth
Debug: rank = 500          // Fifth
```

### Visual Result

```
┌─┐
│📁│ Explorer (100)
├─┤
│🔍│ Search (200)
├─┤
│⎇ │ SCM (300)
├─┤
│🧩│ Extensions (400)
├─┤
│🐛│ Debug (500)
└─┘
```

## Our Customization

See: [[Activity Bar]]

### Knowledge-First Ranking

```typescript
// Our panels FIRST (lower rank)

Notes Library: rank = 50      // TOP!
Tags Browser: rank = 60       // Second
Knowledge Graph: rank = 70    // Third
Backlinks: rank = 80          // Fourth
Daily Notes: rank = 90        // Fifth

// Theia defaults LOWER (higher rank)

Explorer: rank = 500          // Below our stuff
Search: rank = 600
Source Control: rank = 700

// Advanced features LOWEST (highest rank)

Terminal: rank = 1000         // Last (revealed late)
```

### Visual Result

```
┌─┐
│📚│ Notes (50)        ← Our panels first!
├─┤
│🏷️│ Tags (60)
├─┤
│📊│ Graph (70)
├─┤
│🔗│ Backlinks (80)
├─┤
│📅│ Daily (90)
├─┤
│📁│ Explorer (500)    ← Theia panels lower
├─┤
│🔍│ Search (600)
├─┤
│⎇ │ SCM (700)
└─┘
```

## Implementation

### Registering with Rank

```typescript
@injectable()
export class NotesLibraryContribution implements ViewContribution {

  registerViewContainer(): void {
    const notesContainer = this.widgetManager.createWidget('notes-container')

    this.sidePanelHandler.register(notesContainer, {
      rank: 50,                    // ← Rank here!
      iconClass: 'fa fa-book',
      title: 'Notes Library'
    })
  }
}
```

### SidePanelHandler Sorting

```typescript
export class SidePanelHandler {

  protected items: Map<string, SidePanelItem> = new Map()

  register(widget: Widget, options: {
    rank?: number,
    iconClass?: string,
    title?: string
  }): void {
    this.items.set(widget.id, {
      widget,
      rank: options.rank ?? 100,  // Default rank 100
      iconClass: options.iconClass,
      title: options.title
    })

    // Re-render with new order
    this.updateToolbar()
  }

  protected updateToolbar(): void {
    // Sort by rank
    const sorted = Array.from(this.items.values())
      .sort((a, b) => a.rank - b.rank)

    this.toolbar.render(sorted)
  }
}
```

## Progressive Disclosure

See: [[Progressive Disclosure Pattern]]

### Conditional Registration

```typescript
@injectable()
export class ProgressiveActivityBarContribution {

  @inject(ProgressiveDisclosureService)
  protected readonly disclosure: ProgressiveDisclosureService

  async registerViewContainers(): Promise<void> {
    // Always show knowledge panels (low rank)
    await this.registerKnowledgePanels()

    // Conditionally show IDE panels (high rank)
    if (this.disclosure.shouldShow('file-explorer')) {
      await this.registerFileExplorer()
    }

    if (this.disclosure.shouldShow('source-control')) {
      await this.registerSourceControl()
    }
  }

  protected async registerKnowledgePanels(): Promise<void> {
    this.sidePanelHandler.register(notesWidget, {
      rank: 50,
      iconClass: 'fa fa-book',
      title: 'Notes'
    })

    this.sidePanelHandler.register(tagsWidget, {
      rank: 60,
      iconClass: 'fa fa-tags',
      title: 'Tags'
    })
  }

  protected async registerFileExplorer(): Promise<void> {
    this.sidePanelHandler.register(explorerWidget, {
      rank: 500,  // Lower priority (higher rank)
      iconClass: 'fa fa-folder',
      title: 'Files'
    })
  }
}
```

### Dynamic Re-Ranking

```typescript
// User advances from beginner → intermediate
onUserLevelChanged(newLevel: UserLevel): void {
  if (newLevel === 'intermediate') {
    // Reveal file explorer
    this.registerFileExplorer()

    // Activity Bar automatically re-sorts by rank
  }
}
```

## Rank Conventions

### Recommended Ranges

```typescript
// 1-49: Reserved for critical/special panels
// 50-99: Knowledge-first panels (our custom stuff)
// 100-499: Standard IDE panels (if visible)
// 500-999: Advanced IDE panels (revealed later)
// 1000+: Rarely-used panels (revealed last)
```

### Our Assignments

```typescript
export const PanelRanks = {
  // Knowledge-first (always visible)
  NOTES: 50,
  TAGS: 60,
  GRAPH: 70,
  BACKLINKS: 80,
  DAILY_NOTES: 90,

  // Basic IDE features (revealed for intermediate)
  EXPLORER: 500,
  SEARCH: 600,

  // Advanced IDE features (revealed for advanced)
  SOURCE_CONTROL: 700,
  DEBUG: 800,
  TERMINAL: 900,
}
```

## Location in Code

**SidePanelHandler:**
`node_modules/@theia/core/src/browser/shell/side-panel-handler.ts`

**Sorting Logic:**
Around line 150-200, in the `updateToolbar()` method

## Overriding Default Ranks

### Rebind Existing Contributions

```typescript
// In our extension module
export default new ContainerModule(bind => {

  // Override default Explorer contribution
  bind(ExplorerContribution).toSelf().inSingletonScope()

  // Patch its rank
  bind(ContributionProvider)
    .toProvider(ctx => () => {
      const explorer = ctx.container.get(ExplorerContribution)
      explorer.rank = 500  // Lower priority!
      return explorer
    })
})
```

### Alternative: Disable and Re-Register

```typescript
// Disable default
this.sidePanelHandler.unregister('explorer')

// Re-register with our rank
this.sidePanelHandler.register(explorerWidget, {
  rank: 500,
  iconClass: 'fa fa-folder',
  title: 'Files'
})
```

## User Customization

### Allow User to Reorder

```typescript
// Save user's preferred order
interface ActivityBarPreferences {
  order: string[]  // Widget IDs in desired order
}

// Apply custom order
protected applyCustomOrder(preferences: ActivityBarPreferences): void {
  preferences.order.forEach((widgetId, index) => {
    const item = this.items.get(widgetId)
    if (item) {
      item.rank = index * 10  // 0, 10, 20, 30, ...
    }
  })

  this.updateToolbar()
}
```

## Related Concepts

- [[Activity Bar]]
- [[Side Panel Handlers]]
- [[Progressive Disclosure Pattern]]
- [[View Containers]]
- [[Project Vision - Knowledge-First IDE]]
