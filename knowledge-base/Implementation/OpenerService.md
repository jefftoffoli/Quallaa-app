# OpenerService

## What It Is

**OpenerService** = Central service in Theia that decides how to open files and URIs

Acts as an auction system where multiple handlers bid to open a resource.

## Physical Metaphor

**Mail Sorting Facility**

```
Package arrives (URI to open)
    ↓
Multiple handlers inspect it:
  - PDF Handler: "I can open this!" (priority: 500)
  - Image Handler: "I can open this!" (priority: 600)
  - Text Handler: "I can open this!" (priority: 100)
    ↓
Highest bidder wins → Image Handler opens it
```

## How It Works

### 1. Registration

Handlers register themselves:

```typescript
@injectable()
export class MarkdownEditorOpenHandler implements OpenHandler {

  readonly id = 'markdown-wysiwyg-editor'

  canHandle(uri: URI): number {
    // Return priority (0 = can't handle, higher = better)
    return uri.path.ext === '.md' ? 1000 : 0
  }

  async open(uri: URI, options?: OpenerOptions): Promise<Widget> {
    // Open the file
    const widget = await this.createMarkdownEditor(uri)
    this.shell.addWidget(widget, { area: 'main' })
    return widget
  }
}
```

### 2. Auction Process

```typescript
@injectable()
export class OpenerService {

  protected handlers: OpenHandler[] = []

  registerHandler(handler: OpenHandler): void {
    this.handlers.push(handler)
  }

  async getOpener(uri: URI): Promise<OpenHandler | undefined> {
    // Ask all handlers: "Can you open this?"
    const bids = this.handlers.map(handler => ({
      handler,
      priority: handler.canHandle(uri)
    }))

    // Filter out "can't handle" (priority 0)
    const capable = bids.filter(bid => bid.priority > 0)

    // Sort by priority (highest first)
    capable.sort((a, b) => b.priority - a.priority)

    // Winner!
    return capable[0]?.handler
  }

  async open(uri: URI, options?: OpenerOptions): Promise<Widget | undefined> {
    const handler = await this.getOpener(uri)

    if (!handler) {
      throw new Error(`No handler for ${uri}`)
    }

    return handler.open(uri, options)
  }
}
```

## Priority Ranges

See: [[OpenHandler Priority System]]

```typescript
// Convention:
0          = Can't handle
1-99       = Very low priority (fallback)
100-499    = Low priority (basic handlers)
500-999    = Medium priority (standard handlers)
1000-1999  = High priority (specialized handlers)
2000+      = Very high priority (overrides)
```

## Our Use Case

### Default Theia

```
Open .md file:
  - MonacoEditor: 500 ← Wins (source view)
```

### Our Customization

```
Open .md file:
  - WYSIWYGEditor: 1000 ← Wins! (our handler)
  - MonacoEditor: 500 (fallback)
```

## Implementation

### Register Our Handler

```typescript
@injectable()
export class MarkdownOpenHandlerContribution implements OpenHandlerContribution {

  @inject(MarkdownEditorOpenHandler)
  protected readonly markdownHandler: MarkdownEditorOpenHandler

  registerHandlers(registry: OpenHandlerRegistry): void {
    registry.registerHandler(this.markdownHandler)
  }
}
```

### Bind in Module

```typescript
export default new ContainerModule(bind => {
  bind(OpenHandler).to(MarkdownEditorOpenHandler).inSingletonScope()
  bind(OpenHandlerContribution).to(MarkdownOpenHandlerContribution).inSingletonScope()
})
```

## Advanced Features

### Options Parameter

```typescript
interface OpenerOptions {
  mode?: 'open' | 'reveal' | 'preview'
  selection?: Range
  widgetOptions?: WidgetOpenerOptions
}

async open(uri: URI, options?: OpenerOptions): Promise<Widget> {
  const widget = await this.getOrCreateWidget(uri)

  if (options?.selection) {
    // Jump to specific line/column
    widget.reveal(options.selection)
  }

  if (options?.mode === 'preview') {
    // Open in preview mode
    widget.setPreviewMode(true)
  }

  return widget
}
```

### External URIs

```typescript
canHandle(uri: URI): number {
  // Handle http/https URLs
  if (uri.scheme === 'http' || uri.scheme === 'https') {
    return 100  // Open in browser
  }

  // Handle file:// URIs
  if (uri.scheme === 'file') {
    if (uri.path.ext === '.md') {
      return 1000  // Our WYSIWYG editor
    }
  }

  return 0
}
```

### Custom URI Schemes

```typescript
// diff://...
// preview://...
// wiki://...

canHandle(uri: URI): number {
  if (uri.scheme === 'wiki') {
    return 1000  // Handle [[Wiki Links]]
  }
  return 0
}

async open(uri: URI): Promise<Widget> {
  // Parse wiki://Note%20Title
  const noteTitle = decodeURIComponent(uri.path.toString())

  // Resolve to actual file
  const file = await this.resolveWikiLink(noteTitle)

  // Open file
  return this.openFile(file)
}
```

## Conflict Resolution

What if two handlers have same priority?

```typescript
// First registered wins
registerHandler(handler: OpenHandler): void {
  // Check for conflicts
  const existing = this.handlers.find(h => h.id === handler.id)

  if (existing) {
    console.warn(`Handler ${handler.id} already registered`)
    return
  }

  this.handlers.push(handler)
}
```

## Testing

```typescript
describe('MarkdownEditorOpenHandler', () => {

  it('should have high priority for .md files', () => {
    const handler = new MarkdownEditorOpenHandler()
    const uri = new URI('file:///workspace/note.md')

    const priority = handler.canHandle(uri)

    expect(priority).toBe(1000)
  })

  it('should not handle non-.md files', () => {
    const handler = new MarkdownEditorOpenHandler()
    const uri = new URI('file:///workspace/file.txt')

    const priority = handler.canHandle(uri)

    expect(priority).toBe(0)
  })

  it('should open WYSIWYG editor', async () => {
    const handler = new MarkdownEditorOpenHandler()
    const uri = new URI('file:///workspace/note.md')

    const widget = await handler.open(uri)

    expect(widget).toBeInstanceOf(MarkdownEditorWidget)
  })
})
```

## Integration with Command

```typescript
// OPEN command uses OpenerService
@injectable()
export class OpenCommand implements CommandContribution {

  @inject(OpenerService)
  protected readonly openerService: OpenerService

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand({
      id: 'file.open',
      label: 'Open File'
    }, {
      execute: (uri: URI) => {
        this.openerService.open(uri)
      }
    })
  }
}
```

## Related Concepts

- [[OpenHandler Priority System]]
- [[Widget System]]
- [[WYSIWYG Markdown Editor]]
- [[Diff Editor Architecture]]
- [[URI Schemes in Theia]]
