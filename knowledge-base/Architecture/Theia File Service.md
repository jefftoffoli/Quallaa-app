# Theia File Service

## What It Is

The **FileService** is Theia's central abstraction layer for all file system operations. It acts as a facade that routes requests to the appropriate **FileSystemProvider** based on URI schemes.

## Why Use It?

**For Quallaa Phase 1:**
- ✅ **No need to reinvent** - robust, tested abstraction already exists
- ✅ **Event-driven** - automatic updates when files change
- ✅ **Future-proof** - can add cloud sync later without changing core code
- ✅ **Consistent** - works the same way across all Theia features
- ✅ **Well-documented** - TypeDoc and examples available

## Architecture

```
┌─────────────────────────────────────┐
│        Your Code                    │
│  (Wiki Links, Notes Index, etc.)   │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│        FileService                  │
│  (Central facade, routes by scheme) │
└──────────────┬──────────────────────┘
               │
               ↓
      ┌────────┴────────┐
      ↓                 ↓
┌──────────┐      ┌──────────┐
│  file:// │      │ custom:// │
│ Provider │      │ Provider  │
└──────────┘      └──────────┘
```

## Scheme-Based Routing

The FileService uses URI schemes to determine which provider handles operations:

- `file:///path/to/note.md` → Local file system provider
- `user-storage:/settings.json` → User preferences provider
- `custom:/remote/file` → Your custom provider (future cloud sync)

## Key Operations

### Read File
```typescript
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { URI } from '@theia/core/lib/common/uri';

@inject(FileService)
protected fileService: FileService;

async readNote(uri: URI): Promise<string> {
  const content = await this.fileService.read(uri);
  return content.value.toString();
}
```

### Write File
```typescript
async writeNote(uri: URI, content: string): Promise<void> {
  await this.fileService.write(uri, content);
}
```

### List Directory
```typescript
async listNotes(dirUri: URI): Promise<string[]> {
  const { children } = await this.fileService.resolve(dirUri);
  return children
    ?.filter(child => child.name.endsWith('.md'))
    .map(child => child.resource.toString()) || [];
}
```

### Watch for Changes
```typescript
// Listen for file changes
this.fileService.onDidFilesChange(event => {
  event.changes.forEach(change => {
    if (change.resource.path.ext === '.md') {
      // Re-index this note
      this.indexService.updateNote(change.resource);
    }
  });
});
```

## FileSystemProvider

You can add custom providers for special URI schemes:

```typescript
@injectable()
export class CloudSyncProvider implements FileSystemProvider {
  readonly capabilities = FileSystemProviderCapabilities.FileReadWrite;
  readonly onDidChangeCapabilities = Event.None;
  readonly onDidChangeFile: Event<FileChange[]>;

  watch(resource: URI): Disposable { /* ... */ }
  stat(resource: URI): Promise<FileStat> { /* ... */ }
  readFile(resource: URI): Promise<Uint8Array> { /* ... */ }
  writeFile(resource: URI, content: Uint8Array): Promise<void> { /* ... */ }
  // ... other methods
}

// Register it
@injectable()
export class CloudSyncContribution implements FileServiceContribution {
  registerFileSystemProviders(service: FileService): void {
    service.registerProvider('cloud', new CloudSyncProvider());
  }
}
```

## Events

The FileService fires events you can listen to:

- `onDidFilesChange` - File created, modified, deleted
- `onDidRunOperation` - After any file operation
- `onWillRunOperation` - Before any file operation (can cancel)

## For Phase 1 Implementation

### Note Indexing Service

```typescript
@injectable()
export class NoteIndexService {
  @inject(FileService)
  protected fileService: FileService;

  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  private index: Map<string, NoteMetadata> = new Map();

  async buildIndex(): Promise<void> {
    const roots = await this.workspaceService.roots;
    for (const root of roots) {
      await this.indexDirectory(new URI(root.resource));
    }
  }

  private async indexDirectory(uri: URI): Promise<void> {
    const { children } = await this.fileService.resolve(uri);
    if (!children) return;

    for (const child of children) {
      if (child.isDirectory) {
        await this.indexDirectory(child.resource);
      } else if (child.name.endsWith('.md')) {
        await this.indexNote(child.resource);
      }
    }
  }

  private async indexNote(uri: URI): Promise<void> {
    const content = await this.fileService.read(uri);
    const text = content.value.toString();

    // Extract title, tags, links, etc.
    const metadata = this.parseNote(text, uri);
    this.index.set(uri.toString(), metadata);
  }

  async findNoteByTitle(title: string): Promise<URI | undefined> {
    for (const [uriStr, metadata] of this.index) {
      if (metadata.title.toLowerCase() === title.toLowerCase()) {
        return new URI(uriStr);
      }
    }
    return undefined;
  }
}
```

## Benefits for Quallaa

1. **Phase 1:** Use `file://` scheme for local notes
2. **Phase 2:** Add watching for live backlinks updates
3. **Phase 3:** Add custom scheme for special note types
4. **Future:** Add `cloud://` provider for sync without changing core code

## Related Concepts

- [[Frontend and Backend Communication]] - FileService works on both sides
- [[Dependency Injection in Theia]] - How to inject FileService
- [[Monorepo Structure]] - Where FileService is located in Theia
- [[Architecture Decisions]] - Decision to use FileService

## Resources

- [FileService TypeDoc](https://eclipse-theia.github.io/theia/docs/next/classes/filesystem.FileService.html)
- [Theia Filesystem Package](https://github.com/eclipse-theia/theia/tree/master/packages/filesystem)
- [VS Code FileSystemProvider API](https://code.visualstudio.com/api/references/vscode-api#FileSystemProvider) (similar design)
