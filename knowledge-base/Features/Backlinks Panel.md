# Backlinks Panel

## What It Is

**Backlinks Panel** = Widget that shows all notes linking TO the currently open note

Also called "Linked Mentions" or "Incoming Links"

## Physical Metaphor

**Citation Tracker**

```
You're reading Paper A.
Who cited Paper A?

Paper B cited it (line 15)
Paper C cited it (line 42)
Paper D cited it (line 8)

Click citation → Jump to that paper
```

## Why It Matters

Backlinks are the CORE of knowledge management:

```
Traditional file system:
folder/
├─ A.md
├─ B.md
└─ C.md

You can't tell who links to who!
```

```
With backlinks:
Open A.md → See:
  ├─ B.md links to this (3 times)
  └─ C.md links to this (1 time)

Open B.md → See:
  └─ A.md links to this (1 time)
```

**Bidirectional knowledge!**

## Visual Structure

```
┌─────────────────────────────┐
│ 🔗 Backlinks                │
├─────────────────────────────┤
│ 📝 Project Ideas.md         │ ← Linking note
│   "See [[Current Note]]"    │ ← Context snippet
│   [Jump to reference →]     │ ← Click to open
├─────────────────────────────┤
│ 📝 Meeting Notes.md         │
│   "Discussed [[Current"     │
│    Note]] today"            │
│   [Jump to reference →]     │
├─────────────────────────────┤
│ 📝 Archive.md               │
│   "Old version: [[Current"  │
│    Note|old]]"              │
│   [Jump to reference →]     │
└─────────────────────────────┘
```

## How It Works

### 1. Link Detection

Scan all files for `[[Current Note Title]]`:

```typescript
async function findBacklinks(targetNote: string): Promise<Backlink[]> {
  const allFiles = await findAllMarkdownFiles()
  const backlinks: Backlink[] = []

  for (const file of allFiles) {
    const content = await readFile(file)
    const links = parseWikiLinks(content)

    for (const link of links) {
      if (link.target === targetNote) {
        backlinks.push({
          sourceFile: file,
          targetNote: targetNote,
          lineNumber: link.lineNumber,
          context: extractContext(content, link.position)
        })
      }
    }
  }

  return backlinks
}
```

### 2. Context Extraction

Show snippet around the link:

```typescript
function extractContext(content: string, position: number): string {
  const lines = content.split('\n')
  const lineIndex = getLineNumber(content, position)

  // Get line with link plus surrounding lines
  const contextLines = lines.slice(
    Math.max(0, lineIndex - 1),
    Math.min(lines.length, lineIndex + 2)
  )

  return contextLines.join('\n')
}
```

### 3. Real-Time Updates

When user edits a file, update backlinks:

```typescript
@injectable()
export class BacklinksService {

  // Watch for file changes
  @postConstruct()
  protected init(): void {
    this.workspace.onDidChangeTextDocument(event => {
      this.updateBacklinksForFile(event.document.uri)
    })
  }

  protected async updateBacklinksForFile(uri: URI): Promise<void> {
    // Reparse links in changed file
    const links = await this.parseLinks(uri)

    // Update backlinks for all referenced notes
    for (const link of links) {
      this.refreshBacklinks(link.target)
    }
  }
}
```

## Implementation

### Widget Structure

```typescript
@injectable()
export class BacklinksWidget extends ReactWidget {

  static readonly ID = 'backlinks-widget'
  static readonly LABEL = 'Backlinks'

  @inject(BacklinksService)
  protected readonly backlinksService: BacklinksService

  @inject(EditorManager)
  protected readonly editorManager: EditorManager

  protected backlinks: Backlink[] = []

  @postConstruct()
  protected init(): void {
    this.id = BacklinksWidget.ID
    this.title.label = BacklinksWidget.LABEL
    this.title.iconClass = 'fa fa-link'
    this.title.closable = true

    // Update when editor changes
    this.editorManager.onCurrentEditorChanged(() => {
      this.updateBacklinks()
    })
  }

  protected async updateBacklinks(): Promise<void> {
    const editor = this.editorManager.currentEditor
    if (!editor) {
      this.backlinks = []
      this.update()
      return
    }

    const currentNoteTitle = this.getNoteTitle(editor.uri)
    this.backlinks = await this.backlinksService.findBacklinks(currentNoteTitle)
    this.update()
  }

  protected render(): React.ReactNode {
    if (this.backlinks.length === 0) {
      return <div className='theia-backlinks-empty'>
        No backlinks to this note
      </div>
    }

    return <div className='theia-backlinks-container'>
      {this.backlinks.map(link =>
        <div key={link.id} className='backlink-item'>
          <div className='backlink-source'>
            <i className='fa fa-file' />
            {link.sourceFile.name}
          </div>
          <div className='backlink-context'>
            {link.context}
          </div>
          <button onClick={() => this.openBacklink(link)}>
            Jump to reference →
          </button>
        </div>
      )}
    </div>
  }

  protected openBacklink(link: Backlink): void {
    this.editorManager.open(link.sourceFile, {
      selection: {
        start: { line: link.lineNumber, character: 0 },
        end: { line: link.lineNumber, character: 0 }
      }
    })
  }
}
```

### Service Implementation

```typescript
@injectable()
export class BacklinksService {

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService

  @inject(WikiLinkParser)
  protected readonly wikiLinkParser: WikiLinkParser

  // Cache for performance
  protected linksCache = new Map<string, WikiLink[]>()

  async findBacklinks(targetTitle: string): Promise<Backlink[]> {
    const backlinks: Backlink[] = []
    const workspace = await this.workspaceService.workspace
    if (!workspace) return backlinks

    // Find all markdown files
    const files = await this.findMarkdownFiles(workspace.uri)

    for (const file of files) {
      const links = await this.getLinksInFile(file)

      for (const link of links) {
        if (link.target === targetTitle ||
            await this.resolvesTo(link.target, targetTitle)) {
          backlinks.push({
            id: `${file.toString()}-${link.position}`,
            sourceFile: file,
            targetNote: targetTitle,
            lineNumber: link.lineNumber,
            context: await this.getContext(file, link),
            timestamp: Date.now()
          })
        }
      }
    }

    return backlinks
  }

  protected async getLinksInFile(uri: URI): Promise<WikiLink[]> {
    // Check cache
    const cached = this.linksCache.get(uri.toString())
    if (cached) return cached

    // Read and parse
    const content = await this.fileSystem.readFile(uri)
    const links = this.wikiLinkParser.parse(content)

    // Cache result
    this.linksCache.set(uri.toString(), links)

    return links
  }
}
```

## Integration with Graph

Backlinks and [[Knowledge Graph View]] are complementary:

```
Graph: Shows ALL connections visually
Backlinks: Shows detailed list for CURRENT note
```

Click node in graph → Update backlinks panel

## Obsidian Comparison

**Obsidian's Backlinks Panel:**
- Shows in right sidebar
- Groups by file
- Shows context snippets
- Click to jump

**Our Implementation:**
- Same features
- Can be in right sidebar or main area
- Integrated with [[Progressive Disclosure Pattern]]

## Progressive Disclosure

**Beginner:** Always visible (core KB feature)
**Intermediate:** Same
**Advanced:** Same

Backlinks are ALWAYS shown because they're fundamental to knowledge management.

## Performance Optimization

### Incremental Updates

```typescript
// Don't rescan everything on every keystroke
protected debounceUpdate = debounce(() => {
  this.updateBacklinks()
}, 500)

protected onDocumentChanged(): void {
  this.debounceUpdate()
}
```

### Smart Caching

```typescript
// Only reparse files that changed
onFileChanged(uri: URI): void {
  this.linksCache.delete(uri.toString())

  // Only update if this file is referenced
  if (this.couldAffectCurrentNote(uri)) {
    this.updateBacklinks()
  }
}
```

### Background Indexing

```typescript
// Build index on startup
async buildIndex(): Promise<void> {
  const files = await this.findAllMarkdownFiles()

  for (const file of files) {
    await this.indexFile(file)
  }
}
```

## Related Concepts

- [[Wiki Links]]
- [[Knowledge Graph View]]
- [[Project Vision - Knowledge-First IDE]]
- [[Foam Project Analysis]]
- [[View Containers]]
- [[Activity Bar]]
