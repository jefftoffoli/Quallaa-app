# View Containers

## What They Are

**View Containers** = Collapsible sections in side panels that contain multiple widgets

Think of them as labeled boxes that hold related widgets together.

## Physical Metaphor

```
Toolbox with Drawers:
┌─────────────────────┐
│ 🧰 Explorer         │ ← View Container
├─────────────────────┤
│ ├─ 📁 File Tree     │ ← Widget 1
│ ├─ 📖 Outline       │ ← Widget 2
│ └─ ⏱️  Timeline      │ ← Widget 3
└─────────────────────┘
```

## Location in Code

**File:** `node_modules/@theia/core/src/browser/view-container.ts`

## How They Work

### 1. View Container Creation

```typescript
export class NavigatorWidgetFactory implements WidgetFactory {
  createWidget(): ViewContainer {
    const viewContainer = this.widgetManager.createWidget(VIEW_CONTAINER_FACTORY_ID)

    viewContainer.id = 'explorer'
    viewContainer.title.label = 'Explorer'
    viewContainer.title.iconClass = 'fa fa-folder'

    return viewContainer
  }
}
```

### 2. Adding Widgets to Container

```typescript
// Register widgets that can be added
@injectable()
export class NavigatorContribution implements FrontendApplicationContribution {

  async onStart(): Promise<void> {
    // Create the view container
    const explorer = await this.widgetManager.getOrCreateWidget(EXPLORER_VIEW_CONTAINER_ID)

    // Add file tree widget
    const fileTree = await this.widgetManager.getOrCreateWidget(FILE_TREE_ID)
    explorer.addWidget(fileTree)

    // Add outline widget
    const outline = await this.widgetManager.getOrCreateWidget(OUTLINE_ID)
    explorer.addWidget(outline)
  }
}
```

### 3. Collapsible Sections

Each widget in the container gets:
- **Header** with title
- **Collapse icon** (▼ expanded / ▶ collapsed)
- **Content area** that shows/hides

```typescript
export class ViewContainer {
  toggleCollapse(widgetId: string): void {
    const part = this.getPart(widgetId)
    if (part) {
      part.collapsed = !part.collapsed
      this.update()
    }
  }
}
```

## Structure

```typescript
interface ViewContainerPart {
  widget: Widget          // The actual widget
  collapsed: boolean      // Is it collapsed?
  order?: number         // Display order
}

export class ViewContainer extends BaseWidget {
  protected parts = new Map<string, ViewContainerPart>()

  addWidget(widget: Widget, options?: { order?: number }): void {
    this.parts.set(widget.id, {
      widget,
      collapsed: false,
      order: options?.order
    })
    this.update()
  }
}
```

## Our Project Usage

For knowledge-first IDE, we'll create view containers like:

### Knowledge Container
```typescript
┌─────────────────────┐
│ 📚 Knowledge        │
├─────────────────────┤
│ ├─ 📝 Notes List    │
│ ├─ 🏷️  Tags         │
│ └─ 📅 Daily Notes   │
└─────────────────────┘
```

### Graph Container
```typescript
┌─────────────────────┐
│ 📊 Connections      │
├─────────────────────┤
│ ├─ 🕸️  Graph View   │
│ └─ 🔗 Backlinks     │
└─────────────────────┘
```

## Key Features

### Multiple Widgets in One Panel
View containers let you stack related widgets together

### Independent Collapse State
Each widget can be collapsed independently

### Drag and Drop
Users can reorder widgets within container (if enabled)

### Persistence
Collapse state saved between sessions

## Related Concepts

- [[Widget System]]
- [[Side Panel Handlers]]
- [[Activity Bar]]
- [[Theia Application Shell]]
- [[Project Vision - Knowledge-First IDE]]
