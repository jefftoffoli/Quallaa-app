# Theia Application Shell

## What It Is

The **ApplicationShell** is the master layout manager for the entire Theia UI.

**Location:** `node_modules/@theia/core/src/browser/shell/application-shell.ts`

## Physical Metaphor

**Convention Center Manager** that assembles and manages the building layout

```
ApplicationShell = Convention Center
├─ Top Panel = Lobby/Reception (menu bar)
├─ Left Side Panel = West Wing (Explorer, etc.)
├─ Main Area = Grand Ballroom (editors)
├─ Bottom Panel = Basement Level (terminal, output)
├─ Right Side Panel = East Wing (outline, etc.)
└─ Status Bar = Information Desk
```

## Initialization Process

```typescript
@postConstruct()
protected init(): void {
  this.initializeShell()
  this.initSidebarVisibleKeyContext()
  this.initFocusKeyContexts()
}

protected initializeShell(): void {
  // 1. Create panels
  this.mainPanel = this.createMainPanel()
  this.topPanel = this.createTopPanel()
  this.bottomPanel = this.createBottomPanel()

  // 2. Create side panel handlers
  this.leftPanelHandler = this.sidePanelHandlerFactory()
  this.leftPanelHandler.create('left', this.options.leftPanel)

  this.rightPanelHandler = this.sidePanelHandlerFactory()
  this.rightPanelHandler.create('right', this.options.rightPanel)

  // 3. Assemble layout
  this.layout = this.createLayout()

  // 4. Setup tracking
  this.tracker.currentChanged.connect(this.onCurrentChanged, this)
}
```

## Layout Structure

The shell uses **nested split layouts**:

```typescript
protected createLayout(): Layout {
  // Stack main + bottom vertically
  const bottomSplitLayout = this.createSplitLayout(
    [this.mainPanel, this.bottomPanel],
    [1, 0],  // main=100%, bottom=0% initially
    { orientation: 'vertical' }
  )

  // Arrange left + center + right horizontally
  const leftRightSplitLayout = this.createSplitLayout(
    [this.leftPanelHandler.container, panelForBottomArea, this.rightPanelHandler.container],
    [0, 1, 0],  // left=0%, center=100%, right=0%
    { orientation: 'horizontal' }
  )

  // Stack top + middle + statusBar vertically
  return this.createBoxLayout(
    [this.topPanel, panelForSideAreas, this.statusBar],
    [0, 1, 0]  // top=0%, middle=100%, status=0%
  )
}
```

**Visual:**

```
┌─────────────────────────────────────┐
│  TOP PANEL (menu bar)               │  ← Hidden by default (browser)
├──────┬──────────────────────┬───────┤
│      │                      │       │
│ LEFT │   MAIN AREA          │ RIGHT │
│ 0%   │   (editors)          │  0%   │  ← Expand when needed
│      │   100%               │       │
│      ├──────────────────────┤       │
│      │ BOTTOM PANEL         │       │
│      │ (terminal) 0%        │       │  ← Expand when needed
├──────┴──────────────────────┴───────┤
│  STATUS BAR                         │
└─────────────────────────────────────┘
```

## Panel Types

### Main Panel (mode: 'multiple-document')
- Can split into multiple editors
- Supports tabs
- Can arrange side-by-side

See: [[Dock Panels]]

### Bottom Panel (mode: 'multiple-document')
- Terminal, output, problems
- Can have multiple tabs
- Collapsible

### Side Panels (mode: 'single-document')
- Only one widget visible at a time
- Activity bar for switching
- Collapsible

See: [[Side Panel Handlers]]

## Adding Widgets

```typescript
shell.addWidget(widget, {
  area: 'left' | 'right' | 'main' | 'bottom',
  mode: 'split-right' | 'tab-after' | ...,
  ref: referenceWidget  // Position relative to this
})
```

See: [[How to Create a Custom Widget]]

## Customizing for Knowledge-First IDE

See: [[How to Customize Application Shell]]

For our project, we need to override:
- Default panel contents
- Activity bar items
- Initial layout
- Progressive disclosure logic

## Related Concepts

- [[Widget System]]
- [[Side Panel Handlers]]
- [[Dock Panels]]
- [[View Containers]]
- [[Activity Bar]]
