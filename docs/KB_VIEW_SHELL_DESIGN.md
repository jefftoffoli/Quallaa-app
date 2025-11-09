# KB View Shell Design Guide

> Built from comprehensive architectural research of Theia 1.66.1
> ApplicationShell system. See
> [THEIA_SHELL_ARCHITECTURE.md](./THEIA_SHELL_ARCHITECTURE.md) for full
> technical details.

## Overview

The KB View shell is a custom layout designed specifically for knowledge base
developers. Instead of the traditional IDE layout, it uses:

1. **Ribbon** - Thin vertical bar on the far left with view icons (replaces
   activity bar)
2. **Dual Sidebars** - Both left and right panels always visible simultaneously
3. **Main Editor Area** - Central editing/viewing area
4. **Status Bar** - Bottom status information bar
5. **No Bottom Panel** - Removes clutter for knowledge-focused work

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Top Panel (Menu Bar)            │  Optional, hidden by default
├────────┬──────────────────────┬─────────┤
│        │                      │         │
│ Ribbon │    Left Panel        │  Main   │  Right Panel  │
│ (thin) │  (taggable,         │  Editor │  (outline,    │
│  icons │  backlinks,         │  Area   │  previews)    │
│        │  related)           │         │               │
│        │                      │         │
├────────┴──────────────────────┴─────────┤
│          Status Bar                     │
└─────────────────────────────────────────┘
```

## Questions Answered

### 1. ApplicationShell Architecture

**Where is ApplicationShell defined?**

- `node_modules/@theia/core/src/browser/shell/application-shell.ts` (2388 lines)
- Main orchestrator for entire IDE layout

**Key Components:**

```typescript
- mainPanel: TheiaDockPanel         // Central editor (multiple-document mode)
- bottomPanel: TheiaDockPanel       // Collapsible panel (multiple-document mode)
- topPanel: Panel                   // Menu bar (hidden by default)
- leftPanelHandler: SidePanelHandler
- rightPanelHandler: SidePanelHandler
- statusBar: StatusBarImpl
```

**Layout System:**

- Built on Lumino's BoxLayout and SplitLayout
- Responsive: uses stretch ratios, not fixed pixels
- Hierarchical: BoxPanel containing SplitPanels containing TheiaDockPanels

### 2. Panel Handler System

**Can Both Sidebars Be Active Simultaneously?**

**YES** - This is already fully supported by Theia's design:

```
[Left Panel] ←→ [Main Area] ←→ [Right Panel]
   ↑                              ↑
Can both be expanded at same time
```

Evidence from `application-shell.ts` line 476-502:

- `leftPanelHandler.expand()` and `rightPanelHandler.expand()` can both be
  called
- SplitPanel handles resizing when both are visible
- Main area (stretch: 1) compresses as sidebars expand

**How They Work:**

- Each side panel has its own `SidePanelHandler` instance
- Handlers manage collapse/expand independently
- Tab selection in one panel doesn't affect the other
- Views can be pinned to prevent collapse

### 3. Shell Swapping

**Can We Swap Shells at Runtime?**

**YES, but carefully** - Two recommended approaches:

#### Approach A: Wrapper Pattern (SAFEST)

```typescript
@injectable()
export class ShellManager {
    private activeShell: ApplicationShell;

    constructor(
        @inject(ApplicationShell) standard: ApplicationShell,
        @inject('KBViewShell') kbView: ApplicationShell
    ) {
        this.activeShell = standard;
    }

    switchMode(mode: 'standard' | 'kbview'): void {
        // Save layout from current shell
        const layoutData = this.activeShell.getLayoutData();

        // Switch shells in DOM
        this.activeShell.node.style.display = 'none';
        const newShell =
            mode === 'standard' ? this.standardShell : this.kbViewShell;
        newShell.node.style.display = 'block';

        // Restore layout to new shell
        newShell.setLayoutData(layoutData);
        this.activeShell = newShell;
    }

    // Proxy all calls to active shell
    async addWidget(widget: Widget, options?: ApplicationShell.WidgetOptions) {
        return this.activeShell.addWidget(widget, options);
    }
}
```

**Why This Works:**

- ApplicationShell DI binding stays unchanged
- Services keep their shell references (they work through the wrapper)
- Layout data survives the swap
- Widgets remain intact

#### Approach B: DI Rebinding (FASTER)

```typescript
// In module initialization
export const customShellModule = new ContainerModule(
    (bind, _unbind, _isBound, rebind) => {
        rebind(ApplicationShell).to(KBViewShell).inSingletonScope();
    }
);
```

**Caveat:**

- All future ApplicationShell injections get the new shell
- Already-instantiated services keep old references
- Requires careful initialization order

### 4. Layout Customization

**Can We Extend ApplicationShell?**

**YES** - The `createLayout()` method is protected (line 753):

```typescript
@injectable()
export class KBViewShell extends ApplicationShell {
    protected override createLayout(): Layout {
        // Create custom layout hierarchy

        // 1. Create ribbon component
        const ribbon = this.createRibbon();

        // 2. Build layout without bottom panel
        const centerSplit = this.createSplitLayout(
            [
                this.leftPanelHandler.container, // Always visible
                this.mainPanel, // Main editor
                this.rightPanelHandler.container, // Always visible
            ],
            [0, 1, 0], // stretch ratios: left fixed, main flexible, right fixed
            { orientation: 'horizontal', spacing: 0 }
        );

        // 3. Combine all
        return this.createBoxLayout(
            [
                this.topPanel,
                new TheiaSplitPanel({ layout: centerSplit }),
                this.statusBar,
            ],
            [0, 1, 0], // stretch ratios
            { direction: 'top-to-bottom', spacing: 0 }
        );
    }

    protected createRibbon(): Widget {
        // Return custom ribbon widget
    }
}
```

**Custom Panel Handlers:**

To prevent collapse/expand behavior:

```typescript
@injectable()
export class AlwaysVisibleSidePanelHandler extends SidePanelHandler {
    override collapse(): Promise<void> {
        // No-op: panel stays visible
        return Promise.resolve();
    }

    override expand(id?: string): Widget | undefined {
        // Already visible, just select widget
        if (id) {
            return this.expand(id);
        }
        return undefined;
    }
}
```

Bind in module:

```typescript
bind(SidePanelHandlerFactory).toFactory(ctx => () => {
    return ctx.container.resolve(AlwaysVisibleSidePanelHandler);
});
```

### 5. Removing the Bottom Panel

**Simply Omit It from Layout:**

```typescript
protected override createLayout(): Layout {
    // Don't create bottomPanel, don't include it in layout

    const layout = this.createBoxLayout(
        [this.topPanel, new TheiaSplitPanel(...), this.statusBar],
        [0, 1, 0],
        { direction: 'top-to-bottom', spacing: 0 }
    );

    // The bottomPanel property still exists (for shell API compat)
    // but it's not in the visual layout tree
    return layout;
}
```

---

## Implementation Roadmap

### Phase 1: KB View Shell Class

```typescript
// theia-extensions/product/src/browser/kb-view-shell.ts

@injectable()
export class KBViewShell extends ApplicationShell {
    protected override createLayout(): Layout {
        // Custom layout without bottom panel
        // With ribbon component
        // Keep sidebars always visible
    }
}

// Bind it
export const kbViewShellModule = new ContainerModule(
    (bind, _unbind, _isBound, rebind) => {
        rebind(ApplicationShell).to(KBViewShell).inSingletonScope();
    }
);
```

### Phase 2: Ribbon Component

```typescript
// theia-extensions/product/src/browser/ribbon-widget.tsx

export class RibbonWidget extends ReactWidget {
    protected render(): React.ReactNode {
        return <div className="kb-view-ribbon">
            <div className="ribbon-item" title="Explorer">
                <i className="codicon codicon-files" />
            </div>
            <div className="ribbon-item" title="Search">
                <i className="codicon codicon-search" />
            </div>
            <div className="ribbon-item" title="Knowledge Graph">
                <i className="codicon codicon-graph" />
            </div>
            {/* More items */}
        </div>;
    }
}
```

### Phase 3: Shell Manager (for Runtime Switching)

```typescript
// thesia-extensions/product/src/browser/shell-manager.ts

@injectable()
export class ShellManager {
    // Implements switching logic
}
```

### Phase 4: CSS Styling

```css
/* CSS for KB View shell */
.kb-view-shell {
    /* Shell container styles */
}

.kb-view-ribbon {
    width: 48px; /* Thin ribbon */
    background: var(--theia-sideBar-background);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
}

.ribbon-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 48px;
    cursor: pointer;
    color: var(--theia-sideBarTitle-foreground);
}

.ribbon-item:hover {
    background: var(--theia-list-hoverBackground);
}
```

---

## Technical Challenges & Solutions

| Challenge                                | Solution                                     |
| ---------------------------------------- | -------------------------------------------- |
| **Both sidebars simultaneously visible** | Already supported; just don't hide them      |
| **Removing bottom panel**                | Omit from `createLayout()` layout tree       |
| **Custom ribbon component**              | Create React widget, include in layout       |
| **Shell swapping at runtime**            | Use wrapper pattern with layout save/restore |
| **Service references to shell**          | Wrapper pattern handles this transparently   |
| **Widget state preservation**            | Use `getLayoutData()` / `setLayoutData()`    |
| **Panel animations**                     | Disable in KB View or customize duration     |
| **Tab bar visibility during collapse**   | Tab bar stays visible always (desired)       |

---

## Key Files to Reference

During implementation, refer to these files:

- **ApplicationShell**:
  `node_modules/@theia/core/src/browser/shell/application-shell.ts`
    - Lines 753-775: `createLayout()` method
    - Lines 976-1019: `addWidget()` method
    - Lines 781-796: `getLayoutData()` method

- **SidePanelHandler**:
  `node_modules/@theia/core/src/browser/shell/side-panel-handler.ts`
    - Lines 248-284: Container layout structure
    - Lines 410-418: Collapse behavior
    - Lines 362-405: Expand behavior

- **DI Module**:
  `node_modules/@theia/core/src/browser/frontend-application-module.ts`
    - Line 172: ApplicationShell binding
    - Lines 173-184: Panel handler bindings

---

## Testing Checklist

Before considering KB View shell complete:

- [ ] Custom layout renders correctly (ribbon, dual sidebars, no bottom panel)
- [ ] Widgets can be added to left panel (area: 'left')
- [ ] Widgets can be added to right panel (area: 'right')
- [ ] Widgets can be added to main area (area: 'main')
- [ ] Both sidebars remain visible when content is added
- [ ] Sidebar widgets can be toggled/selected independently
- [ ] Layout data is saved/restored correctly
- [ ] Shell switching preserves widget state
- [ ] No bottom panel toggle button in status bar
- [ ] Standard shell still works (backward compatibility)
- [ ] Ribbon icons are clickable and functional
- [ ] Responsive: sidebars resize when window is resized

---

## Related Documentation

- [THEIA_SHELL_ARCHITECTURE.md](./THEIA_SHELL_ARCHITECTURE.md) - Complete
  technical research
- [MERGING_UPSTREAM.md](./MERGING_UPSTREAM.md) - Keep in sync with Theia updates
- Theia Docs: https://theia-ide.org/docs/

---

## Questions for Future Work

1. Should the ribbon be resizable? (Currently fixed width)
2. Should views be pinnable to prevent accidental collapse?
3. Should there be a minimap in the KB View shell?
4. Should the main area support split view (vertical columns)?
5. Should there be a breadcrumb navigation?

---

Generated by architectural research of Theia 1.66.1 Date: 2025-11-09
