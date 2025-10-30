# Backlinks Panel

## What It Is

**Backlinks Panel** = Widget that shows all notes linking TO the currently open
note

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
    const allFiles = await findAllMarkdownFiles();
    const backlinks: Backlink[] = [];

    for (const file of allFiles) {
        const content = await readFile(file);
        const links = parseWikiLinks(content);

        for (const link of links) {
            if (link.target === targetNote) {
                backlinks.push({
                    sourceFile: file,
                    targetNote: targetNote,
                    lineNumber: link.lineNumber,
                    context: extractContext(content, link.position),
                });
            }
        }
    }

    return backlinks;
}
```

### 2. Context Extraction

Show snippet around the link:

```typescript
function extractContext(content: string, position: number): string {
    const lines = content.split('\n');
    const lineIndex = getLineNumber(content, position);

    // Get line with link plus surrounding lines
    const contextLines = lines.slice(
        Math.max(0, lineIndex - 1),
        Math.min(lines.length, lineIndex + 2)
    );

    return contextLines.join('\n');
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
            this.updateBacklinksForFile(event.document.uri);
        });
    }

    protected async updateBacklinksForFile(uri: URI): Promise<void> {
        // Reparse links in changed file
        const links = await this.parseLinks(uri);

        // Update backlinks for all referenced notes
        for (const link of links) {
            this.refreshBacklinks(link.target);
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
    protected readonly workspaceService: WorkspaceService;

    @inject(WikiLinkParser)
    protected readonly wikiLinkParser: WikiLinkParser;

    // Cache for performance
    protected linksCache = new Map<string, WikiLink[]>();

    async findBacklinks(targetTitle: string): Promise<Backlink[]> {
        const backlinks: Backlink[] = [];
        const workspace = await this.workspaceService.workspace;
        if (!workspace) return backlinks;

        // Find all markdown files
        const files = await this.findMarkdownFiles(workspace.uri);

        for (const file of files) {
            const links = await this.getLinksInFile(file);

            for (const link of links) {
                if (
                    link.target === targetTitle ||
                    (await this.resolvesTo(link.target, targetTitle))
                ) {
                    backlinks.push({
                        id: `${file.toString()}-${link.position}`,
                        sourceFile: file,
                        targetNote: targetTitle,
                        lineNumber: link.lineNumber,
                        context: await this.getContext(file, link),
                        timestamp: Date.now(),
                    });
                }
            }
        }

        return backlinks;
    }

    protected async getLinksInFile(uri: URI): Promise<WikiLink[]> {
        // Check cache
        const cached = this.linksCache.get(uri.toString());
        if (cached) return cached;

        // Read and parse
        const content = await this.fileSystem.readFile(uri);
        const links = this.wikiLinkParser.parse(content);

        // Cache result
        this.linksCache.set(uri.toString(), links);

        return links;
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

**Beginner:** Always visible (core KB feature) **Intermediate:** Same
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

## Link Health Monitoring

The Backlinks Panel integrates with [[Knowledge Base Maintenance]] to provide
link health indicators:

### Broken Link Detection

```typescript
interface BacklinkHealth {
    type: 'healthy' | 'broken' | 'ambiguous' | 'redirect';
    issue?: string;
    suggestion?: string;
}

async function checkBacklinkHealth(
    backlink: Backlink
): Promise<BacklinkHealth> {
    // Check if target note exists
    const targetExists = await this.fileExists(backlink.targetNote);

    if (!targetExists) {
        // Check if renamed
        const similar = await this.findSimilarNotes(backlink.targetNote);

        if (similar.length > 0) {
            return {
                type: 'broken',
                issue: 'Note not found',
                suggestion: `Did you mean: ${similar[0].title}?`,
            };
        }

        return {
            type: 'broken',
            issue: 'Note deleted or renamed',
            suggestion: 'Update link or create note',
        };
    }

    // Check for ambiguous links (multiple matches)
    const matches = await this.resolveWikiLink(backlink.targetNote);

    if (matches.length > 1) {
        return {
            type: 'ambiguous',
            issue: `${matches.length} notes match this link`,
            suggestion: 'Use full path to disambiguate',
        };
    }

    return { type: 'healthy' };
}
```

### Visual Health Indicators

```typescript
const BacklinkItem: React.FC<{ backlink: Backlink }> = ({ backlink }) => {
  const health = useBacklinkHealth(backlink)

  const getHealthIcon = (): string => {
    switch (health.type) {
      case 'healthy': return '✓'
      case 'broken': return '✗'
      case 'ambiguous': return '?'
      case 'redirect': return '→'
    }
  }

  const getHealthColor = (): string => {
    switch (health.type) {
      case 'healthy': return 'text-green-500'
      case 'broken': return 'text-red-500'
      case 'ambiguous': return 'text-yellow-500'
      case 'redirect': return 'text-blue-500'
    }
  }

  return (
    <div className={`backlink-item ${health.type}`}>
      <span className={`health-indicator ${getHealthColor()}`}>
        {getHealthIcon()}
      </span>

      <div className="backlink-content">
        <div className="backlink-source">{backlink.sourceFile.name}</div>
        <div className="backlink-context">{backlink.context}</div>

        {health.issue && (
          <div className="health-issue">
            <i className="fa fa-exclamation-triangle" />
            {health.issue}
          </div>
        )}

        {health.suggestion && (
          <div className="health-suggestion">
            <i className="fa fa-lightbulb" />
            {health.suggestion}
            <button onClick={() => handleFixSuggestion(backlink, health)}>
              Apply Fix
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Orphan Detection

```typescript
// Show if current note is an orphan
@injectable()
export class BacklinksWidget extends ReactWidget {
  protected render(): React.ReactNode {
    const currentNote = this.editorManager.currentEditor?.uri
    const backlinks = this.backlinks

    // Check orphan status
    const isOrphan = backlinks.length === 0 &&
                     this.outgoingLinks.length === 0

    if (isOrphan) {
      return <div className="orphan-warning">
        <i className="fa fa-exclamation-circle" />
        <h3>Orphaned Note</h3>
        <p>This note has no incoming or outgoing links.</p>

        <button onClick={() => this.suggestLinks()}>
          Find Potential Links
        </button>

        <button onClick={() => this.createLinks()}>
          Create Links Manually
        </button>
      </div>
    }

    // Normal backlinks display
    return <div className="backlinks-container">
      {backlinks.map(link => <BacklinkItem key={link.id} backlink={link} />)}
    </div>
  }

  protected async suggestLinks(): Promise<void> {
    const currentNote = this.editorManager.currentEditor?.uri
    if (!currentNote) return

    // Use similarity analysis to find related notes
    const suggestions = await this.maintenanceService.suggestLinks(currentNote)

    // Show suggestions panel
    this.showSuggestions(suggestions)
  }
}
```

### Link Quality Metrics

```typescript
interface LinkQualityMetrics {
    totalBacklinks: number;
    healthyLinks: number;
    brokenLinks: number;
    ambiguousLinks: number;
    linkDensity: number; // Links per note
    bidirectionalRatio: number; // % of reciprocal links
}

function calculateLinkQuality(backlinks: Backlink[]): LinkQualityMetrics {
    const healthy = backlinks.filter(b => b.health?.type === 'healthy');
    const broken = backlinks.filter(b => b.health?.type === 'broken');
    const ambiguous = backlinks.filter(b => b.health?.type === 'ambiguous');

    return {
        totalBacklinks: backlinks.length,
        healthyLinks: healthy.length,
        brokenLinks: broken.length,
        ambiguousLinks: ambiguous.length,
        linkDensity: backlinks.length / (await this.getTotalNotes()),
        bidirectionalRatio: this.calculateBidirectionalRatio(backlinks),
    };
}
```

### Bulk Link Maintenance

```typescript
// Batch operations on broken links
export class LinkMaintenancePanel extends ReactWidget {
  protected render(): React.ReactNode {
    const brokenLinks = this.backlinks.filter(b => b.health?.type === 'broken')

    if (brokenLinks.length === 0) {
      return <div className="all-healthy">
        All links are healthy ✓
      </div>
    }

    return <div className="link-maintenance">
      <h3>Broken Links ({brokenLinks.length})</h3>

      <div className="bulk-actions">
        <button onClick={() => this.fixAllSuggestions()}>
          Apply All Suggestions
        </button>

        <button onClick={() => this.removeAllBroken()}>
          Remove All Broken Links
        </button>

        <button onClick={() => this.createMissingNotes()}>
          Create Missing Notes
        </button>
      </div>

      <div className="broken-links-list">
        {brokenLinks.map(link => (
          <BrokenLinkItem key={link.id} link={link} />
        ))}
      </div>
    </div>
  }
}
```

## Maintenance Features

### Auto-Fix Suggestions

When a link breaks (note renamed or deleted):

```
Backlinks Panel shows:
  ⚠️ Link Broken
  → "Project Ideas.md" not found
  💡 Did you mean "Project Plan.md"?
  [Apply Fix] [Ignore] [Create Note]
```

### Orphan Warnings

When note has no connections:

```
🚨 Orphaned Note
No incoming or outgoing links detected.

Suggestions:
  - Link to "Architecture" (78% similar)
  - Link to "Features" (65% similar)
  - Link to "Planning" (52% similar)

[Create Links] [Ignore]
```

### Link Health Summary

```
📊 Link Health
━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Healthy:     15 (83%)
✗ Broken:       2 (11%)
? Ambiguous:    1 (6%)

[View Issues] [Run Maintenance]
```

## Related Concepts

- [[Wiki Links]]
- [[Knowledge Graph View]]
- [[Project Vision - Knowledge-First IDE]]
- [[Foam Project Analysis]]
- [[View Containers]]
- [[Activity Bar]]
- [[Knowledge Base Maintenance]]
- [[Knowledge Graph Health Metrics]]
- [[AI Deletion Agents]]
