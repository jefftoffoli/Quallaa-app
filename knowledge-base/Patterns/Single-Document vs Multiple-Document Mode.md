# Single-Document vs Multiple-Document Mode

## What It Is

**Document Mode** = How a panel handles multiple widgets

- **Single-Document:** Only one visible at a time (like radio buttons)
- **Multiple-Document:** Can split and tab (like browser tabs)

## Physical Metaphor

### Single-Document Mode

**Museum Room**

```
Only one exhibit visible at a time:

Currently showing: Painting A
Want to see Painting B?
→ Painting A disappears
→ Painting B appears

Can't show both simultaneously.
```

### Multiple-Document Mode

**Multi-Monitor Setup**

```
Multiple screens showing different content:

Monitor 1: Editor A
Monitor 2: Editor B
Monitor 3: Terminal

Can split, arrange, tab between them.
```

## Where Each Mode Is Used

### Single-Document Mode

**Side Panels** (left and right):

```
┌─┬────────────────┬─┐
│📚│                │  │
│🏷️│  Only ONE      │  │
│📊│  visible       │  │
│  │                │  │
└─┴────────────────┴─┘
 ↑
Click different icon
→ Replaces content
```

**Bottom Panel:**

```
┌─────────────────────┐
│   Main Area         │
├─────────────────────┤
│ Terminal            │ ← Only one visible
│ (or Problems/etc)   │
└─────────────────────┘
```

(Note: In some configurations, bottom panel uses multiple-document mode)

### Multiple-Document Mode

**Main Area:**

```
┌─────────────────────┐
│ Editor A │ Editor B │ ← Tabs
├──────────┴──────────┤
│                     │
│   Content           │
│                     │
└─────────────────────┘

Or split:

┌──────────┬──────────┐
│ Editor A │ Editor B │ ← Side by side
│          │          │
└──────────┴──────────┘
```

## Implementation

### DockPanel Options

```typescript
export class ApplicationShell {

  protected createLeftPanel(): DockPanel {
    const panel = new DockPanel({
      mode: 'single-document'  // ← Only one visible
    })
    return panel
  }

  protected createMainPanel(): DockPanel {
    const panel = new DockPanel({
      mode: 'multiple-document'  // ← Can split/tab
    })
    return panel
  }
}
```

### Widget Addition

```typescript
// Single-document mode
leftPanel.addWidget(notesWidget)
leftPanel.addWidget(tagsWidget)

// User sees EITHER notes OR tags, not both

// Multiple-document mode
mainPanel.addWidget(editorA)
mainPanel.addWidget(editorB)

// User can see BOTH (tabs or split)
```

## Behavior Differences

### Adding Widgets

**Single-document:**
```typescript
// Adding new widget replaces current
panel.addWidget(newWidget)
→ Current widget hidden
→ New widget shown
```

**Multiple-document:**
```typescript
// Adding new widget creates new tab
panel.addWidget(newWidget)
→ New tab appears
→ Previous tabs still accessible
```

### Closing Widgets

**Single-document:**
```typescript
// Close current widget
panel.close(widget)
→ Panel shows previous widget (if any)
→ Or shows empty state
```

**Multiple-document:**
```typescript
// Close widget
panel.close(widget)
→ Tab disappears
→ Activates adjacent tab
```

## Our Project Usage

### Knowledge Panels (Single-Document)

```
Left side:
┌─┬────────────────┐
│📚│ Notes List     │ ← Active
│🏷️│                │
│📊│                │
└─┴────────────────┘

Click Tags icon:
┌─┬────────────────┐
│📚│                │
│🏷️│ Tags Browser   │ ← Active now
│📊│                │
└─┴────────────────┘
```

**Rationale:** Simple, focused, one thing at a time

### Editor Area (Multiple-Document)

```
┌─────────────────────────┐
│ note1.md │ note2.md     │ ← Can tab
├──────────┴──────────────┤
│                         │
│   WYSIWYG Editor        │
│                         │
└─────────────────────────┘

Or split:
┌───────────┬─────────────┐
│ note1.md  │ note2.md    │
│           │             │
│ Editor    │ Editor      │
│           │             │
└───────────┴─────────────┘
```

**Rationale:** Users need to reference multiple notes

## Programmatic Control

### Force Single Widget Visible

```typescript
// In single-document mode
class LeftPanel {
  showWidget(widgetId: string): void {
    const widget = this.getWidget(widgetId)

    // Hide all others
    for (const w of this.widgets) {
      w.hide()
    }

    // Show requested
    widget.show()
    this.activateWidget(widgetId)
  }
}
```

### Allow Multiple Widgets

```typescript
// In multiple-document mode
class MainArea {
  addWidget(widget: Widget, options?: {
    mode?: 'split-left' | 'split-right' | 'tab'
  }): void {
    if (options?.mode === 'split-left') {
      this.panel.addWidget(widget, { mode: 'split-left' })
    } else {
      this.panel.addWidget(widget, { mode: 'tab-after' })
    }

    // Don't hide others!
  }
}
```

## User Preference

Some applications let users choose:

```typescript
// Preference: "editor.openBehavior"
if (this.preferences.get('editor.openBehavior') === 'replace') {
  // Single-document behavior
  this.closeOthers(currentWidget)
}
// Otherwise: multiple-document (default)
```

## Obsidian Comparison

**Obsidian:**
- Left sidebar: Single-document (like ours)
- Main area: Multiple-document (tabs + splits)
- Right sidebar: Multiple-document (can stack panels)

**Our Implementation:**
- Similar to Obsidian
- Left: Single-document
- Main: Multiple-document
- Right: Single-document (or multiple, TBD)

## Related Concepts

- [[Theia Application Shell]]
- [[Side Panel Handlers]]
- [[Activity Bar]]
- [[Dock Panels]]
- [[Widget System]]
