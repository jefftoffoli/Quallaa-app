# Theia ApplicationShell Architecture Research

## Executive Summary

Theia's `ApplicationShell` is a sophisticated layout management system that
orchestrates the entire IDE's user interface. It is **not a monolithic class**
but rather a composition of multiple specialized handlers (SidePanelHandler,
StatusBar, DockPanels) arranged through a sophisticated layout system using
Lumino widgets.

To build a custom KB View shell with a ribbon component and dual sidebars, we
have three viable paths:

1. **Extend ApplicationShell** (recommended) - Override `createLayout()` and
   panel handlers
2. **Replace ApplicationShell via DI** - Bind a custom subclass at the module
   level
3. **Wrap ApplicationShell** - Create a wrapper shell and swap it dynamically

---

## 1. ApplicationShell Architecture

### 1.1 Core Structure

**File:**
`/Users/jefftoffoli/Documents/GitHub/Quallaa-app/node_modules/@theia/core/src/browser/shell/application-shell.ts`

The ApplicationShell is composed of these major components:

```typescript
export class ApplicationShell extends Widget {
    // Core panels
    mainPanel: TheiaDockPanel; // Central editor area (multiple-document mode)
    bottomPanel: TheiaDockPanel; // Collapsible bottom panel (multiple-document mode)
    topPanel: Panel; // Top panel for menu bar (hidden by default)

    // Side panel handlers
    leftPanelHandler: SidePanelHandler; // Left sidebar with tabs and collapse/expand
    rightPanelHandler: SidePanelHandler; // Right sidebar with tabs and collapse/expand

    // Status bar
    statusBar: StatusBarImpl; // Bottom status bar
}
```

### 1.2 Layout Structure

The layout is created in the `createLayout()` method (line 753-775):

```
ApplicationShell (BoxLayout: top-to-bottom)
├── topPanel (Panel) [stretch: 0, height: auto]
├── panelForSideAreas (TheiaSplitPanel, horizontal split) [stretch: 1]
│   ├── leftPanelHandler.container (BoxPanel) [stretch: 0, width: ~19.1%]
│   │   ├── topMenu (SidebarMenuWidget - activity bar for top)
│   │   ├── tabBar (SideTabBar - vertical icon bar)
│   │   ├── additionalViewsMenu (hidden overflow menu)
│   │   └── bottomMenu (SidebarMenuWidget - activity bar for bottom)
│   │   └── dockPanel (TheiaDockPanel, single-document mode)
│   │
│   ├── panelForBottomArea (TheiaSplitPanel, vertical split) [stretch: 1]
│   │   ├── mainPanel (TheiaDockPanel, multiple-document mode) [stretch: 1]
│   │   └── bottomPanel (TheiaDockPanel, multiple-document mode, hidden) [stretch: 0]
│   │
│   └── rightPanelHandler.container (BoxPanel) [stretch: 0, width: ~19.1%]
│       ├── topMenu
│       ├── tabBar (SideTabBar - vertical icon bar)
│       ├── additionalViewsMenu
│       ├── bottomMenu
│       └── dockPanel (TheiaDockPanel, single-document mode)
│
└── statusBar (StatusBarImpl) [stretch: 0, height: auto]
```

**Key Points:**

- The layout uses Lumino's BoxLayout and SplitLayout for responsive sizing
- Left/right panels use `stretch: 0` (fixed width based on content)
- Main area uses `stretch: 1` (takes remaining space)
- All measurements are in relative sizes, not pixels
- The layout is a tree of BoxPanels and SplitPanels

### 1.3 Panel Regions

```typescript
// ApplicationShell.Area type (line 2229)
export type Area =
    | 'main'
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'secondaryWindow';

// Utility functions
export function isSideArea(area?: string): area is 'left' | 'right' | 'bottom' {
    return area === 'left' || area === 'right' || area === 'bottom';
}
```

---

## 2. SidePanelHandler Architecture

**File:**
`/Users/jefftoffoli/Documents/GitHub/Quallaa-app/node_modules/@theia/core/src/browser/shell/side-panel-handler.ts`

### 2.1 Structure and Initialization

```typescript
@injectable()
export class SidePanelHandler {
    // Visual components
    tabBar: SideTabBar;                  // Vertical icon bar (left/right oriented)
    additionalViewsMenu: AdditionalViewsMenuWidget;  // Overflow menu for hidden tabs
    topMenu: SidebarMenuWidget;          // Top menu widget (renders as activity bar icons)
    bottomMenu: SidebarMenuWidget;       // Bottom menu widget
    toolBar: SidePanelToolbar;           // Title bar showing current widget
    dockPanel: TheiaDockPanel;           // Single-document mode panel
    container: Panel;                    // Container holding all above in BoxLayout

    // State tracking
    readonly state: SidePanel.State = {
        empty: true,
        expansion: SidePanel.ExpansionState.collapsed,  // collapsed | expanding | expanded
        pendingUpdate: Promise.resolve(),
        lastActiveTabIndex?: number,
        lastPanelSize?: number
    };

    // Configuration
    protected side: 'left' | 'right';
    protected options: SidePanel.Options;
}
```

### 2.2 Container Layout (lines 248-284)

```typescript
protected createContainer(): Panel {
    // Content area: toolbar + dock panel
    const contentBox = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 });
    BoxPanel.setStretch(this.toolBar, 0);
    contentBox.addWidget(this.toolBar);
    BoxPanel.setStretch(this.dockPanel, 1);
    contentBox.addWidget(this.dockPanel);
    const contentPanel = new BoxPanel({ layout: contentBox });

    // Sidebar area: top menu + tab bar + additional menu + bottom menu
    const sidebarContainerLayout = new PanelLayout();
    const sidebarContainer = new Panel({ layout: sidebarContainerLayout });
    sidebarContainerLayout.addWidget(this.topMenu);
    sidebarContainerLayout.addWidget(this.tabBar);
    sidebarContainerLayout.addWidget(this.additionalViewsMenu);
    sidebarContainerLayout.addWidget(this.bottomMenu);

    // Combine sidebar + content in BoxPanel
    const containerLayout = new BoxLayout({
        direction: side === 'left' ? 'left-to-right' : 'right-to-left',
        spacing: 0
    });
    BoxPanel.setStretch(sidebarContainer, 0);    // Fixed width
    BoxPanel.setStretch(contentPanel, 1);         // Takes remaining space
    containerLayout.addWidget(sidebarContainer);
    containerLayout.addWidget(contentPanel);

    const boxPanel = new BoxPanel({ layout: containerLayout });
    return boxPanel;
}
```

### 2.3 Key Behaviors

**Tab Bar (SideTabBar):**

- Vertical orientation for left/right panels
- Supports drag-and-drop widget reordering
- Tab selection controls visibility in dock panel
- Only one widget visible at a time (single-document mode)

**Dock Panel (TheiaDockPanel):**

- `mode: 'single-document'` - only one widget visible
- Synchronized with tab bar selection
- `currentTitle` property controls which widget is shown

**Expand/Collapse Logic:**

- `expand(id?)` - Shows the side panel with animation, restores last size
- `collapse()` - Hides the dock panel, tab bar remains visible for clicking
- Animation duration configurable via `SidePanel.Options.expandDuration`

### 2.4 Configuration Options

```typescript
export interface SidePanel.Options {
    expandThreshold: number;      // Distance to edge before auto-expanding during drag (px)
    expandDuration: number;       // Animation duration when expanding (ms)
    initialSizeRatio: number;     // Initial width/height as ratio of parent (0-1)
    emptySize: number;           // Size when panel is empty (px)
}

// Defaults in ApplicationShell
leftPanel: {
    emptySize: 140,
    expandThreshold: 140,
    expandDuration: 0,
    initialSizeRatio: 0.191        // ~19.1% of screen width
}
```

---

## 3. The Activity Bar

The "Activity Bar" in Theia is NOT a single component. It's actually two
**SidebarMenuWidget** instances (top and bottom) that render icon buttons.

**File:**
`/Users/jefftoffoli/Documents/GitHub/Quallaa-app/node_modules/@theia/core/src/browser/shell/sidebar-menu-widget.tsx`

### 3.1 SidebarMenuWidget Structure

```typescript
@injectable()
export class SidebarMenuWidget extends ReactWidget {
    protected readonly items: SidebarMenuItem[];

    addMenu(menu: SidebarMenu): void
    removeMenu(menuId: string): void

    protected render(): React.ReactNode {
        return <React.Fragment>
            {this.items.map(item => this.renderItem(item))}
        </React.Fragment>;
    }
}

export interface SidebarMenu {
    id: string;
    iconClass: string;           // CSS class for icon (e.g., 'codicon codicon-files')
    title: string;               // Hover tooltip
    menuPath: MenuPath;           // Menu path for context menu
    onDidBadgeChange?: Event<number>;  // Badge number (notification count)
    order: number;               // Sort order (lower = lower position)
}
```

### 3.2 How Views Register

Views (like "File Explorer", "Search") register their tabs by contributing a
menu to the sidebar's menu path:

1. The view creates a SidebarMenu object with icon, title, etc.
2. Call `sidePanelHandler.addTopMenu(menu)` or `.addBottomMenu(menu)`
3. The menu renders as an icon button in the appropriate sidebar menu widget
4. Clicking the icon opens a context menu with view options

**Important:** The activity bar is purely for UI navigation. The actual widgets
(views) are in the dock panel behind it.

---

## 4. Panel Handler System - Can Both Be Active Simultaneously?

**SHORT ANSWER: Yes, but only in their current design.**

### 4.1 Current Design Limitation

Both left and right panels **CAN be expanded at the same time** - this is
already supported:

```typescript
// From ApplicationShell.onDragOver (lines 476-502)
// Left panel can be expanded
if (
    expLeft &&
    !state.leftExpanded &&
    this.leftPanelHandler.tabBar.currentTitle === null
) {
    this.leftPanelHandler.expand();
    state.leftExpanded = true;
}

// Right panel can ALSO be expanded simultaneously
if (
    expRight &&
    !state.rightExpanded &&
    this.rightPanelHandler.tabBar.currentTitle === null
) {
    this.rightPanelHandler.expand();
    state.rightExpanded = true;
}
```

However, the **bottom panel is mutually exclusive** with the main panel's
expanded state (it can't be both visible and hidden based on current toggle
button logic).

### 4.2 How Panels Interact

The panels are laid out horizontally:

```
[Left Panel] | [Main Area + Bottom Panel] | [Right Panel]
```

The SplitPanel handles the sizing:

- When left expands, main area shrinks (stretch ratio: 1 keeps it flexible)
- When right expands, main area shrinks
- When both expand, main area shrinks further

The "tab bar" in each side panel is separate - they don't interfere with each
other.

---

## 5. Shell Swapping at Runtime

### 5.1 How ApplicationShell is Bound

**File:**
`/Users/jefftoffoli/Documents/GitHub/Quallaa-app/node_modules/@theia/core/src/browser/frontend-application-module.ts`
(line 172)

```typescript
bind(ApplicationShell).toSelf().inSingletonScope();
```

This binding:

- Creates a singleton instance of ApplicationShell
- Injected into various services that need it
- Never recreated during the app lifecycle

### 5.2 Runtime Swapping Strategy

To swap shells at runtime, you have these options:

#### Option A: Rebind in DI Container (RECOMMENDED)

```typescript
// In your module's init or activation hook
const container = /* get inversify container */;
container.unbind(ApplicationShell);
container.bind(ApplicationShell).to(KBViewShell).inSingletonScope();

// Problem: Services already have references to the old shell
// Solution: Manually update references or restart the app
```

#### Option B: Wrapper Pattern (SAFER)

```typescript
@injectable()
export class ShellFacade {
    private activeShell: ApplicationShell;

    constructor(
        private standardShell: ApplicationShell,
        private kbViewShell: KBViewShell
    ) {
        this.activeShell = standardShell;
    }

    switchToKBView(): void {
        // Detach current shell
        this.activeShell.node.style.display = 'none';

        // Attach new shell
        this.kbViewShell.node.style.display = 'block';
        this.activeShell = this.kbViewShell;
    }

    // Forward all methods to activeShell
    async addWidget(
        widget: Widget,
        options?: ApplicationShell.WidgetOptions
    ): Promise<void> {
        return this.activeShell.addWidget(widget, options);
    }

    // ... etc for all public methods
}
```

#### Option C: Event-Based Replacement

```typescript
// Create a custom shell service that wraps ApplicationShell
@injectable()
export class ShellService {
    private shellChanged = new Emitter<'standard' | 'kbview'>();
    readonly onShellChanged = this.shellChanged.event;

    constructor(
        @inject(ApplicationShell) private standardShell: ApplicationShell,
        @inject('KBViewShell') private kbViewShell: ApplicationShell
    ) {}

    setShellMode(mode: 'standard' | 'kbview'): void {
        // Swap shells by re-layouting or re-attaching
        this.shellChanged.fire(mode);
    }
}
```

### 5.3 Preserving Widget State When Swapping

Both shells would need to:

1. Call `getLayoutData()` on the old shell before switching
2. Store the layout data
3. Attach the new shell to the DOM
4. Call `setLayoutData()` on the new shell with the saved data

```typescript
async switchShells(fromShell: ApplicationShell, toShell: ApplicationShell): Promise<void> {
    // Save state
    const layoutData = fromShell.getLayoutData();

    // Swap DOM
    fromShell.node.remove();
    document.body.appendChild(toShell.node);

    // Restore state
    await toShell.setLayoutData(layoutData);
}
```

---

## 6. Layout Customization

### 6.1 Can We Extend ApplicationShell?

**YES.** The `createLayout()` method is `protected`, so subclasses can override
it:

```typescript
@injectable()
export class KBViewShell extends ApplicationShell {
    protected override createLayout(): Layout {
        // Custom layout without bottom panel
        // With ribbon instead of activity bar
        // With dual sidebars always visible

        const ribbon = new RibbonWidget();
        const leftSidebar = this.leftPanelHandler.container;
        const rightSidebar = this.rightPanelHandler.container;
        const mainArea = new BoxPanel();
        mainArea.addWidget(this.mainPanel);

        const centerSplit = this.createSplitLayout(
            [leftSidebar, mainArea, rightSidebar],
            [0, 1, 0],
            { orientation: 'horizontal', spacing: 0 }
        );

        const layout = this.createBoxLayout(
            [
                ribbon,
                new TheiaSplitPanel({ layout: centerSplit }),
                this.statusBar,
            ],
            [0, 1, 0],
            { direction: 'top-to-bottom', spacing: 0 }
        );

        return layout;
    }
}
```

### 6.2 Ribbon Component Implementation

A ribbon is a **thin vertical bar on the far left** with icons for different
views, similar to Visual Studio.

To create a ribbon:

1. Create a custom React widget with vertical icon bar
2. Instead of using the activity bar (SidebarMenuWidget), create your own
3. Add it to the layout as the first item

```typescript
export class RibbonWidget extends ReactWidget {
    protected render(): React.ReactNode {
        return <div className="kb-view-ribbon">
            <div className="ribbon-item" onClick={() => this.onViewSelected('explorer')}>
                <i className="codicon codicon-files" />
            </div>
            <div className="ribbon-item" onClick={() => this.onViewSelected('search')}>
                <i className="codicon codicon-search" />
            </div>
            {/* More ribbon items */}
        </div>;
    }
}
```

### 6.3 Removing the Bottom Panel Entirely

Override `createLayout()` and don't include `bottomPanel`:

```typescript
protected override createLayout(): Layout {
    // Skip bottom panel creation and include

    const centerSplit = this.createSplitLayout(
        [this.leftPanelHandler.container, this.mainPanel, this.rightPanelHandler.container],
        [0, 1, 0],
        { orientation: 'horizontal', spacing: 0 }
    );

    return this.createBoxLayout(
        [this.topPanel, new TheiaSplitPanel({ layout: centerSplit }), this.statusBar],
        [0, 1, 0],
        { direction: 'top-to-bottom', spacing: 0 }
    );
}
```

### 6.4 Forcing Dual Sidebars Always Visible

Currently, sidebars are collapsed/expanded based on toggle state. To keep them
always visible:

```typescript
@injectable()
export class AlwaysVisibleSidePanelHandler extends SidePanelHandler {
    override collapse(): Promise<void> {
        // Do nothing - panel stays expanded
        return Promise.resolve();
    }

    override expand(id?: string): Widget | undefined {
        // Already visible
        return super.expand(id);
    }
}

// In your module:
bind(SidePanelHandlerFactory).toFactory(ctx => () => {
    return ctx.container.resolve(AlwaysVisibleSidePanelHandler);
});
```

---

## 7. Panel Manager Methods

### 7.1 Widget Management

```typescript
// Add widget to specific area
async addWidget(widget: Widget, options?: ApplicationShell.WidgetOptions): Promise<void>

// Options structure
interface WidgetOptions {
    area?: 'main' | 'top' | 'left' | 'right' | 'bottom' | 'secondaryWindow';
    mode?: DockLayout.InsertMode | 'open-to-left' | 'open-to-right' | 'tab-replace';
    ref?: Widget;  // Reference widget for insertion point
    rank?: number; // Sort order for side panels
}

// Close widget
async closeWidget(id: string): Promise<Widget | undefined>

// Activate (focus) widget
async activateWidget(id: string): Promise<void>

// Get widget for area
getWidgets(area: ApplicationShell.Area): Widget[]

// Get area for widget
getAreaFor(input: TabBar<Widget> | Widget): ApplicationShell.Area | undefined
```

### 7.2 Panel State Management

```typescript
// Expand/collapse panels
expandPanel(area: ApplicationShell.Area): void
async collapsePanel(area: ApplicationShell.Area): Promise<void>

// Check if expanded
isExpanded(area: ApplicationShell.Area): boolean

// Toggle panel
async togglePanel(area: ApplicationShell.Area): Promise<void>

// Get layout data (for saving)
getLayoutData(): ApplicationShell.LayoutData

// Restore layout (for loading)
async setLayoutData(layoutData: ApplicationShell.LayoutData): Promise<void>
```

### 7.3 Key Implementation Details

- Side panels use `SidePanelHandler` for their collapse/expand behavior
- Main and bottom panels are TheiaDockPanels that manage tab bars and widgets
- The `track()` method registers widgets with FocusTracker for context key
  updates
- Layout restoration happens asynchronously, respecting panel animation delays

---

## 8. DI Container Configuration

### 8.1 Current Binding (Frontend Application Module)

```typescript
// Line 172
bind(ApplicationShell).toSelf().inSingletonScope();

// Line 173-174: Side panel handlers are auto-factories
bind(SidePanelHandlerFactory).toAutoFactory(SidePanelHandler);
bind(SidePanelHandler).toSelf();

// Line 175-178: Sidebar menus (activity bar)
bind(SidebarTopMenuWidgetFactory).toAutoFactory(SidebarMenuWidget);
bind(SidebarMenuWidget).toSelf();
bind(SidebarBottomMenuWidget).toSelf();
bind(SidebarBottomMenuWidgetFactory).toAutoFactory(SidebarBottomMenuWidget);
```

### 8.2 How Services Get the Shell

```typescript
@injectable()
export class SomeService {
    constructor(@inject(ApplicationShell) private shell: ApplicationShell) {}
}
```

All services that need the shell inject `ApplicationShell` token directly. This
means:

- If you rebind `ApplicationShell`, all new instances of services get the new
  shell
- Already-instantiated services keep references to the old shell
- Singleton scope ensures only one instance exists at a time

### 8.3 To Create Your Custom Shell

```typescript
// In your module
export const customShellModule = new ContainerModule(
    (bind, _unbind, _isBound, rebind) => {
        // Option 1: Rebind to subclass
        rebind(ApplicationShell).to(KBViewShell).inSingletonScope();

        // Option 2: Or bind to factory
        bind(ApplicationShell)
            .toFactory(ctx => {
                const options = ctx.container.get(ApplicationShellOptions);
                const shell = new KBViewShell(
                    ctx.container.get(DockPanelRendererFactory),
                    ctx.container.get(StatusBarImpl),
                    ctx.container.get(SidePanelHandlerFactory)
                    // ... all other deps
                );
                return shell;
            })
            .inSingletonScope();
    }
);
```

---

## 9. Key Files Reference

| File                             | Purpose                     | Key Content                                        |
| -------------------------------- | --------------------------- | -------------------------------------------------- |
| `application-shell.ts`           | Main shell orchestrator     | Layout creation, widget management, panel handlers |
| `side-panel-handler.ts`          | Left/right panel management | Expand/collapse, widget visibility, drag-drop      |
| `sidebar-menu-widget.tsx`        | Activity bar (icon buttons) | Menu rendering, icon management                    |
| `theia-dock-panel.ts`            | Document panels             | Widget layout, tab management                      |
| `theia-split-panel.ts`           | Split layout container      | Resizable dividers between panels                  |
| `shell-layout-restorer.ts`       | Layout persistence          | Save/restore layout across sessions                |
| `frontend-application-module.ts` | DI bindings                 | Service registration and configuration             |
| `view-contribution.ts`           | View registration pattern   | AbstractViewContribution base class                |

---

## 10. Recommendations for KB View Shell

### 10.1 Architecture

```
KBViewShell (extends ApplicationShell)
├── Override createLayout()
├── Custom ribbon component instead of activity bar
├── Keep both sidebars always visible
├── Remove bottom panel
├── Possibly customize side panel handler behavior
```

### 10.2 Implementation Steps

1. Create `KBViewShell` class extending `ApplicationShell`
2. Override `createLayout()` to:
    - Add ribbon component at top
    - Keep left and right sidebars always visible
    - Omit bottom panel
    - Adjust main area to fill remaining space

3. Create optional `AlwaysVisibleSidePanelHandler` extending `SidePanelHandler`
   to prevent collapse

4. Bind in module:

    ```typescript
    // Option: Conditional binding based on app mode
    bind(ApplicationShell)
        .to(useKBView ? KBViewShell : ApplicationShell)
        .inSingletonScope();
    ```

5. For runtime switching:
    - Use wrapper pattern (ShellFacade) to swap shells
    - Save layout before swap
    - Restore layout after swap

### 10.3 Key Challenges

1. **Widget state preservation** - Save/restore with `getLayoutData()` /
   `setLayoutData()`
2. **Service references** - Services cache ApplicationShell refs, need careful
   rebinding
3. **Panel animations** - SidePanelHandler has expand/collapse animations,
   override for different behavior
4. **Tab bar visibility** - Currently tab bar stays visible during collapse,
   customize if needed
5. **Activity bar menus** - Views register menus via
   `addTopMenu()`/`addBottomMenu()`, adapt for ribbon

---

## Summary Table

| Aspect                | Current Design                            | Customization Options                       |
| --------------------- | ----------------------------------------- | ------------------------------------------- |
| **Sidebars**          | Collapse/expand toggle                    | Extend SidePanelHandler to prevent collapse |
| **Activity Bar**      | Menu-based icons                          | Replace with custom ribbon component        |
| **Bottom Panel**      | Collapsible, mutually exclusive with main | Omit entirely from layout                   |
| **Dual Sidebars**     | Already supported                         | Just keep them expanded via custom handler  |
| **Layout Structure**  | BoxLayout + SplitLayout tree              | Override `createLayout()` to rebuild tree   |
| **Shell Swapping**    | Not built-in                              | Use wrapper pattern or DI rebinding         |
| **Widget Management** | Via addWidget() with area option          | Can be wrapped/proxied                      |
| **Configuration**     | Via ApplicationShellOptions DI            | Can extend options interface                |
