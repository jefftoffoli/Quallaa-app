# Frontend and Backend Communication

## What It Is

**Frontend-Backend Split** = Theia runs as two separate processes that communicate via JSON-RPC

- **Frontend:** Browser/Electron UI
- **Backend:** Node.js server

## Physical Metaphor

**Restaurant**

```
Frontend (Dining Room):
- UI that customers see
- Displays data
- Captures user actions
- Runs in browser

Backend (Kitchen):
- File system access
- Heavy processing
- System operations
- Runs in Node.js

Communication:
Customer orders (RPC call) → Kitchen prepares → Delivers food (RPC response)
```

## Why This Architecture?

### Browser Limitations

```
Browser can't:
❌ Access file system directly
❌ Run native processes
❌ Install packages
❌ Access system resources

Node.js can:
✅ Full file system access
✅ Spawn processes
✅ Install npm packages
✅ System APIs
```

### Solution

```
UI in Browser ←→ RPC ←→ Backend in Node.js
```

## Communication Method

### JSON-RPC

**JSON-RPC** = Remote Procedure Call using JSON

```typescript
// Frontend calls backend method
const result = await backend.readFile('/path/to/file')

// Under the hood:
Frontend sends:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "readFile",
  "params": ["/path/to/file"]
}

Backend responds:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "file contents here"
}
```

## Implementation

### Backend Service

```typescript
// packages/my-extension/src/node/my-backend-service.ts

@injectable()
export class MyBackendService {

  // This runs on BACKEND (Node.js)

  async readFile(path: string): Promise<string> {
    // Can use fs here!
    const fs = require('fs').promises
    return await fs.readFile(path, 'utf-8')
  }

  async executeCommand(command: string): Promise<string> {
    // Can spawn processes!
    const { exec } = require('child_process')
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) reject(error)
        else resolve(stdout)
      })
    })
  }

  async installPackage(packageName: string): Promise<void> {
    // Can run npm!
    const { spawn } = require('child_process')
    const npm = spawn('npm', ['install', packageName])

    return new Promise((resolve, reject) => {
      npm.on('close', code => {
        if (code === 0) resolve()
        else reject(new Error(`npm failed: ${code}`))
      })
    })
  }
}
```

### Service Path

```typescript
// Define the RPC path
export const MyBackendService = Symbol('MyBackendService')
export const MY_BACKEND_SERVICE_PATH = '/services/my-backend'
```

### Backend Binding

```typescript
// packages/my-extension/src/node/my-backend-module.ts

import { ContainerModule } from '@theia/core/shared/inversify'
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core'

export default new ContainerModule(bind => {
  // Bind service
  bind(MyBackendService).toSelf().inSingletonScope()

  // Expose via RPC
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new JsonRpcConnectionHandler(MY_BACKEND_SERVICE_PATH, () => {
      return ctx.container.get(MyBackendService)
    })
  ).inSingletonScope()
})
```

### Frontend Proxy

```typescript
// packages/my-extension/src/browser/my-frontend-client.ts

import { RpcProxy } from '@theia/core'

@injectable()
export class MyFrontendClient {

  @inject(MyBackendService)
  @named(RpcProxy)
  protected readonly backend: MyBackendService

  // This runs on FRONTEND (Browser)

  async loadFile(path: string): Promise<void> {
    // Call backend method via RPC
    const content = await this.backend.readFile(path)

    // Update UI
    this.displayContent(content)
  }

  async runCommand(command: string): Promise<void> {
    const output = await this.backend.executeCommand(command)
    this.showOutput(output)
  }
}
```

### Frontend Binding

```typescript
// packages/my-extension/src/browser/my-frontend-module.ts

import { ContainerModule } from '@theia/core/shared/inversify'
import { WebSocketConnectionProvider } from '@theia/core/lib/browser'

export default new ContainerModule(bind => {
  bind(MyFrontendClient).toSelf().inSingletonScope()

  // Connect to backend
  bind(MyBackendService).toDynamicValue(ctx => {
    const connection = ctx.container.get(WebSocketConnectionProvider)
    return connection.createProxy<MyBackendService>(MY_BACKEND_SERVICE_PATH)
  }).inSingletonScope()
})
```

## Our Use Case

### Note Indexing Service

```typescript
// Backend: Scan file system for notes
@injectable()
export class NoteIndexBackend {

  async indexAllNotes(workspacePath: string): Promise<NoteIndex> {
    const fs = require('fs').promises
    const path = require('path')

    // Recursively find all .md files
    const notes: Note[] = []

    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          await scan(fullPath)  // Recurse
        } else if (entry.name.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf-8')
          const title = extractTitle(content)
          const links = parseWikiLinks(content)
          const tags = parseTags(content)

          notes.push({
            path: fullPath,
            title,
            links,
            tags
          })
        }
      }
    }

    await scan(workspacePath)

    return { notes }
  }
}
```

```typescript
// Frontend: Request index from UI
@injectable()
export class NoteIndexWidget extends ReactWidget {

  @inject(NoteIndexBackend)
  protected readonly backend: NoteIndexBackend

  async refreshIndex(): Promise<void> {
    this.showLoading()

    // Call backend (may take a while)
    const index = await this.backend.indexAllNotes(this.workspacePath)

    // Update UI
    this.displayNotes(index.notes)
    this.hideLoading()
  }
}
```

## Communication Patterns

### Request-Response

```typescript
// Frontend asks, backend answers
const result = await backend.doSomething()
```

### Notifications (Backend → Frontend)

```typescript
// Backend can notify frontend

// Backend
export class WatcherBackend {
  @inject(FileWatcherClient)
  protected readonly client: FileWatcherClient

  async watchFile(path: string): Promise<void> {
    fs.watch(path, () => {
      // Notify frontend!
      this.client.onFileChanged(path)
    })
  }
}

// Frontend
export interface FileWatcherClient {
  onFileChanged(path: string): void
}

export class FileWatcherWidget implements FileWatcherClient {
  onFileChanged(path: string): void {
    console.log(`File changed: ${path}`)
    this.refresh()
  }
}
```

### Events

```typescript
// Use events for pub-sub

// Backend
export class FileSystemBackend {
  private onDidChangeEmitter = new Emitter<URI>()
  readonly onDidChange = this.onDidChangeEmitter.event

  protected notifyChange(uri: URI): void {
    this.onDidChangeEmitter.fire(uri)
  }
}

// Frontend
backend.onDidChange(uri => {
  console.log(`Changed: ${uri}`)
})
```

## Performance Considerations

### Don't Send Large Data

```typescript
// ❌ Bad: Send entire file content
const content = await backend.readFile(largePath)  // 10MB

// ✅ Good: Send only what's needed
const excerpt = await backend.readFileExcerpt(largePath, 0, 1000)  // 1KB
```

### Batch Operations

```typescript
// ❌ Bad: Multiple RPC calls
for (const file of files) {
  await backend.readFile(file)  // Network round-trip each time!
}

// ✅ Good: Single RPC call
const contents = await backend.readFiles(files)  // One round-trip
```

### Cache on Frontend

```typescript
// Cache results to avoid repeated RPC calls
export class CachedBackendClient {
  protected cache = new Map<string, any>()

  async readFile(path: string): Promise<string> {
    if (this.cache.has(path)) {
      return this.cache.get(path)
    }

    const content = await this.backend.readFile(path)
    this.cache.set(path, content)
    return content
  }
}
```

## Security

### Validate Inputs

```typescript
// Backend should validate paths
async readFile(path: string): Promise<string> {
  // ❌ Don't trust frontend!
  // return fs.readFile(path)  // Path traversal attack!

  // ✅ Validate
  const workspace = this.getWorkspacePath()
  const resolved = path.resolve(workspace, path)

  if (!resolved.startsWith(workspace)) {
    throw new Error('Access denied')
  }

  return fs.readFile(resolved, 'utf-8')
}
```

## Debugging

### Log RPC Calls

```typescript
// Set environment variable
DEBUG=theia:rpc npm start

// See RPC traffic in console
→ readFile ["/path/to/file"]
← "file contents"
```

## Related Concepts

- [[Next.js vs Theia Architecture]]
- [[Dependency Injection in Theia]]
- [[Monorepo Structure]]
- [[Project Vision - Knowledge-First IDE]]
