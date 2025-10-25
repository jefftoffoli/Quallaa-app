# OpenHandler Priority System

## What It Is

When a file is opened, multiple handlers might want to handle it. The **priority number** determines which one wins.

**Location:** `@theia/core/lib/browser/opener-service.ts`

## Physical Metaphor

**Auction for Files** - handlers bid on files, highest bidder wins

```
File arrives: README.md

Who wants to open it?
├─ MonacoEditor: "I'll bid 100!"
├─ MarkdownPreview: "I'll bid 500!"
└─ WYSIWYGEditor: "I'll bid 1000!"  ← WINS!

Highest bidder opens the file!
```

## OpenHandler Interface

```typescript
export interface OpenHandler {
  readonly id: string
  readonly label?: string

  // Return priority (0 = can't handle, higher = stronger claim)
  canHandle(uri: URI, options?: OpenerOptions): MaybePromise<number>

  // Open the file
  open(uri: URI, options?: OpenerOptions): MaybePromise<object | undefined>
}
```

## Example: Markdown Handlers

```typescript
// Monaco Editor (basic text editing)
canHandle(uri: URI): number {
  if (uri.scheme === 'file' && uri.path.ext === '.md') {
    return 100  // Low priority
  }
  return 0
}

// Markdown Preview
canHandle(uri: URI): number {
  if (uri.scheme === 'file' && uri.path.ext === '.md') {
    return 500  // Medium priority
  }
  return 0
}

// WYSIWYG Editor (our vision!)
canHandle(uri: URI): number {
  if (uri.scheme === 'file' && uri.path.ext === '.md') {
    return 1000  // HIGH PRIORITY - WINS!
  }
  return 0
}
```

## How OpenerService Selects

```typescript
async getOpener(uri: URI): Promise<OpenHandler> {
  const handlers = /* all registered handlers */

  // Ask each handler for their priority
  const priorities = await Promise.all(
    handlers.map(async h => ({
      handler: h,
      priority: await h.canHandle(uri)
    }))
  )

  // Filter out those that can't handle (priority 0)
  const capable = priorities.filter(p => p.priority > 0)

  // Sort by priority (highest first)
  capable.sort((a, b) => b.priority - a.priority)

  // Return highest priority handler
  return capable[0].handler
}
```

## Priority Ranges (Convention)

```
0       = Cannot handle
1-99    = Very low priority
100-499 = Low priority (default editors)
500-999 = Medium priority (special viewers)
1000+   = High priority (custom handlers)
```

## Use Cases

### 1. Override Default Behavior

Make `.md` files open in WYSIWYG by default:

```typescript
canHandle(uri: URI): number {
  if (uri.path.ext === '.md') {
    return 1000  // Beat everyone else!
  }
  return 0
}
```

### 2. Conditional Handlers

Open large files in hex viewer:

```typescript
async canHandle(uri: URI): Promise<number> {
  const size = await this.getFileSize(uri)
  if (size > 10_000_000) {  // 10MB
    return 1000  // High priority for large files
  }
  return 0
}
```

### 3. User Preferences

Let users choose:

```typescript
canHandle(uri: URI): number {
  const defaultEditor = this.preferences.get('markdown.defaultEditor')

  if (uri.path.ext === '.md') {
    if (defaultEditor === 'wysiwyg') {
      return 1000
    }
  }
  return 0
}
```

## Related to Our Project

For our [[WYSIWYG Markdown Editor]], we need HIGH priority:

```typescript
@injectable()
export class MarkdownWYSIWYGOpenHandler implements OpenHandler {
  canHandle(uri: URI): number {
    if (uri.scheme === 'file') {
      const ext = uri.path.ext.toLowerCase()
      if (ext === '.md' || ext === '.markdown') {
        return 1000  // ← Higher than Monaco (100) and Preview (500)
      }
    }
    return 0
  }
}
```

## Related Concepts

- [[OpenerService]]
- [[WYSIWYG Markdown Editor]]
- [[How to Register an OpenHandler]]
- [[Widget System]]
- [[URI Schemes in Theia]]
