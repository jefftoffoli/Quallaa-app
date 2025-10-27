# Widget System

## What Is a Widget?

A **Widget** is the fundamental UI building block in Theia. Everything you see is a widget.

Theia uses **Lumino** (formerly PhosphorJS) widgets under the hood.

## Physical Metaphor

**LEGO Bricks** that snap together to build the UI

```
Widget = LEGO brick
├─ Has connectors (can attach to shell)
├─ Has content (what it displays)
├─ Has lifecycle (created, attached, detached, disposed)
└─ Can contain other widgets
```

## Widget Hierarchy

```
ApplicationShell (root widget)
├─ MainPanel (DockPanel widget)
│  ├─ EditorWidget
│  ├─ EditorWidget
│  └─ TerminalWidget (in split)
├─ LeftPanel (SidePanelHandler)
│  ├─ ExplorerWidget (ViewContainer)
│  ├─ SearchWidget (ViewContainer)
│  └─ GitWidget (ViewContainer)
└─ StatusBar (widget)
```

## Base Widget Class

```typescript
import { BaseWidget } from '@theia/core/lib/browser'

export class MyWidget extends BaseWidget {
  constructor() {
    super()
    this.id = 'my-widget-id'  // Unique ID
    this.title.label = 'My Widget'  // Tab title
    this.title.closable = true  // Can close tab
    this.title.iconClass = 'my-icon'  // Tab icon
    this.addClass('my-widget-class')  // CSS class
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    // Widget is now in DOM
    this.initialize()
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg)
    // Widget became active (focused)
    this.node.focus()
  }
}
```

## React Widgets

For React-based UIs:

```typescript
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget'

export class MyReactWidget extends ReactWidget {
  constructor() {
    super()
    this.id = 'my-react-widget'
    this.title.label = 'My React Widget'
  }

  protected render(): React.ReactNode {
    return <div className='my-content'>
      Hello from React!
    </div>
  }
}
```

## Widget Lifecycle

```
1. Created (constructor called)
   ↓
2. Attached to DOM (onAfterAttach)
   ↓
3. Shown/Hidden (onAfterShow/onAfterHide)
   ↓
4. Activated/Deactivated (onActivateRequest)
   ↓
5. Resized (onResize)
   ↓
6. Detached (onBeforeDetach)
   ↓
7. Disposed (dispose called)
```

## Widget Factory Pattern

See: [[Widget Factories]]

Widgets are created by factories:

```typescript
@injectable()
export class MyWidgetFactory implements WidgetFactory {
  readonly id = 'my-widget'

  createWidget(options: any): Promise<Widget> {
    return new MyWidget(options)
  }
}
```

## Widget Options

```typescript
export interface WidgetOptions {
  area?: 'left' | 'right' | 'main' | 'bottom'
  rank?: number  // Order in activity bar
  mode?: 'split-right' | 'tab-after' | ...
  ref?: Widget  // Position relative to this
}
```

See: [[OpenHandler Priority System]]

## Common Widget Types

### StatefulWidget
Widgets that save/restore state

### NavigatableWidget
Widgets that represent a file/resource

### Saveable
Widgets with save/dirty state

### ViewContainer
Widgets that contain other widgets with collapsible sections

See: [[View Containers]]

## Related Concepts

- [[How to Create a Custom Widget]]
- [[Widget Factories]]
- [[View Containers]]
- [[Theia Application Shell]]
- [[React in Theia]]
