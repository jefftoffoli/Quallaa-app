# Quick Switcher

## What It Is

**Quick Switcher** = Keyboard shortcut (Cmd+O / Ctrl+O) that opens a fuzzy search to quickly jump to any note

Also called "Quick Open" or "File Switcher"

## Physical Metaphor

**Teleporter**

```
Instead of:
1. Open file browser
2. Navigate folders
3. Find file
4. Click to open

Just type name → WHOOSH → You're there!
```

## Visual Example

```
User presses Cmd+O:

┌─────────────────────────────────┐
│ > proj                          │ ← User types
├─────────────────────────────────┤
│ 📝 Project Ideas                │ ← Matches!
│ 📝 Product Roadmap              │ ← Matches!
│ 📝 Programming Notes            │ ← Matches!
│ 📁 projects/archive/old.md      │ ← Matches folder
└─────────────────────────────────┘

Press Enter → Opens top match
```

## How It Works

### 1. Fuzzy Matching

```typescript
// "proj" matches "Project Ideas"
// "pdi" matches "Product Ideas"
// "arc" matches "Architecture"

function fuzzyMatch(query: string, target: string): boolean {
  let queryIndex = 0

  for (const char of target.toLowerCase()) {
    if (char === query[queryIndex]?.toLowerCase()) {
      queryIndex++
    }
  }

  return queryIndex === query.length
}
```

### 2. Ranking Results

```typescript
interface SearchResult {
  title: string
  path: URI
  score: number  // Higher = better match
}

function rankResults(query: string, notes: Note[]): SearchResult[] {
  return notes
    .map(note => ({
      title: note.title,
      path: note.uri,
      score: calculateScore(query, note)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
}

function calculateScore(query: string, note: Note): number {
  let score = 0

  // Exact match = highest score
  if (note.title.toLowerCase() === query.toLowerCase()) {
    score += 1000
  }

  // Starts with query = high score
  if (note.title.toLowerCase().startsWith(query.toLowerCase())) {
    score += 500
  }

  // Contains query = medium score
  if (note.title.toLowerCase().includes(query.toLowerCase())) {
    score += 100
  }

  // Fuzzy match = lower score
  if (fuzzyMatch(query, note.title)) {
    score += 50
  }

  // Bonus: Recently opened
  if (note.lastOpened && Date.now() - note.lastOpened < 3600000) {
    score += 200
  }

  // Bonus: Frequently opened
  score += (note.openCount || 0) * 10

  return score
}
```

### 3. Create on No Match

**Important Obsidian feature:**

```
User types: "My New Idea"
No matches found

Options:
1. Show "Create 'My New Idea'" option
2. Press Enter → Creates new note
```

```typescript
function handleNoResults(query: string): SearchResult[] {
  return [{
    title: `Create "${query}"`,
    path: new URI(`file://${workspaceRoot}/${query}.md`),
    score: -1,  // Special marker
    isCreation: true
  }]
}

async function handleSelection(result: SearchResult): Promise<void> {
  if (result.isCreation) {
    // Create new note
    await this.fileService.create(result.path, `# ${result.title}\n\n`)
  }

  // Open note
  await this.editorManager.open(result.path)
}
```

## Implementation

### Widget Implementation

```typescript
@injectable()
export class QuickSwitcherWidget extends QuickOpenWidget {

  static readonly ID = 'quick-switcher'

  @inject(WorkspaceService)
  protected readonly workspace: WorkspaceService

  @inject(NoteIndexService)
  protected readonly noteIndex: NoteIndexService

  @inject(EditorManager)
  protected readonly editorManager: EditorManager

  async onType(query: string): Promise<QuickOpenItem[]> {
    if (!query) {
      // Show recently opened
      return this.getRecentlyOpened()
    }

    // Search notes
    const notes = await this.noteIndex.getAllNotes()
    const results = this.rankResults(query, notes)

    // Convert to QuickOpenItems
    const items = results.map(result => this.toQuickOpenItem(result))

    // Add "Create" option if no exact match
    if (!this.hasExactMatch(query, results)) {
      items.unshift(this.createNewNoteItem(query))
    }

    return items
  }

  protected toQuickOpenItem(result: SearchResult): QuickOpenItem {
    return {
      label: result.title,
      description: result.path.fsPath,
      iconClass: 'fa fa-file-text',
      run: (mode: QuickOpenMode) => {
        if (mode === QuickOpenMode.OPEN) {
          this.editorManager.open(result.path)
          return true
        }
        return false
      }
    }
  }

  protected createNewNoteItem(query: string): QuickOpenItem {
    return {
      label: `$(plus) Create "${query}"`,
      description: 'New note',
      iconClass: 'fa fa-plus',
      run: (mode: QuickOpenMode) => {
        if (mode === QuickOpenMode.OPEN) {
          this.createAndOpenNote(query)
          return true
        }
        return false
      }
    }
  }

  protected async createAndOpenNote(title: string): Promise<void> {
    const workspace = await this.workspace.workspace
    if (!workspace) return

    const fileName = `${title}.md`
    const filePath = workspace.uri.resolve(fileName)

    // Create file with title
    await this.fileService.create(filePath, `# ${title}\n\n`)

    // Open in editor
    await this.editorManager.open(filePath)
  }
}
```

### Keyboard Binding

```typescript
@injectable()
export class QuickSwitcherKeybinding implements KeybindingContribution {

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: QuickSwitcherCommand.id,
      keybinding: 'ctrlcmd+o'  // Cmd+O on Mac, Ctrl+O on Windows
    })
  }
}
```

### Command Registration

```typescript
@injectable()
export class QuickSwitcherCommand implements CommandContribution {

  static readonly id = 'quick-switcher.open'

  @inject(QuickSwitcherWidget)
  protected readonly quickSwitcher: QuickSwitcherWidget

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand({
      id: QuickSwitcherCommand.id,
      label: 'Quick Switcher: Open Note'
    }, {
      execute: () => {
        this.quickSwitcher.open()
      }
    })
  }
}
```

## Note Indexing

For fast searching, maintain an index:

```typescript
@injectable()
export class NoteIndexService {

  protected notes = new Map<string, Note>()

  @postConstruct()
  protected async init(): Promise<void> {
    // Build initial index
    await this.buildIndex()

    // Watch for changes
    this.workspace.onDidChangeTextDocument(() => {
      this.rebuildIndex()
    })
  }

  protected async buildIndex(): Promise<void> {
    const files = await this.findAllMarkdownFiles()

    for (const file of files) {
      const title = await this.extractTitle(file)

      this.notes.set(file.toString(), {
        title,
        uri: file,
        lastOpened: this.getLastOpened(file),
        openCount: this.getOpenCount(file)
      })
    }
  }

  getAllNotes(): Note[] {
    return Array.from(this.notes.values())
  }
}
```

## Obsidian Comparison

**Obsidian Quick Switcher:**
- Cmd+O shortcut
- Fuzzy search
- Create on no match
- Shows recent files when empty

**Our Implementation:**
- Identical behavior
- Same keyboard shortcut
- Same "create new" feature

## Progressive Disclosure

**Beginner:** Always available (core KB feature)
**Intermediate:** Same
**Advanced:** Same

Quick Switcher is ALWAYS visible because it's fundamental to fast navigation.

## Advanced Features

### Show File Path for Disambiguation

```
Query: "ideas"

Results:
📝 Ideas             (projects/ideas.md)
📝 Ideas             (archive/ideas.md)
```

### Filter by Tag

```
Query: "#project ideas"

Results:
📝 Project Ideas     [#project]
📝 New Projects      [#project]
```

### Recent Files Mode

```
Query: (empty)

Results:
📝 Last edited 2 minutes ago
📝 Last edited 1 hour ago
📝 Last edited yesterday
```

### Preview on Arrow Keys

```typescript
protected onNavigate(result: SearchResult): void {
  // Show preview without opening
  this.previewService.showPreview(result.path)
}
```

## Related Concepts

- [[Wiki Links]]
- [[Knowledge Graph View]]
- [[Backlinks Panel]]
- [[Project Vision - Knowledge-First IDE]]
- [[Obsidian-Like Experience]]
