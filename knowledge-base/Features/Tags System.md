# Tags System

## What It Is

**Tags** = Lightweight categorization using `#tag` syntax in markdown

Cross-cutting organization that works alongside folders.

## Physical Metaphor

**Library Card Catalog**

```
Old library system:
- Each book has multiple index cards
- Cards filed under different subjects
- Same book appears in multiple categories

Tags work the same:
- Note can have multiple tags
- Tag view shows all notes with that tag
- Flexible, non-hierarchical
```

## Syntax

### Inline Tags

```markdown
This is a #project note about #design and #planning.

Tags detected: #project, #design, #planning
```

### Frontmatter Tags

```markdown
---
tags: [project, design, planning]
---

# My Project

Content here...
```

### Nested Tags

```markdown
#project/app
#project/website
#project/research

Hierarchy: project > app/website/research
```

## Why Tags Matter

### Cross-Cutting Organization

```
Folders: Hierarchical
notes/
├── projects/
│   └── app.md
└── meetings/
    └── kickoff.md

Tags: Flexible
#project = app.md + kickoff.md + design.md + ...
```

### Multiple Categories

```markdown
# Feature Idea

This note is:
- A #project
- About #design
- Status: #in-progress
- For #client-x

Four ways to find this note!
```

### Dynamic Collections

```
All #in-progress notes
All #urgent + #bug notes
All #project - #archived notes
```

## Implementation

### Tag Detection

```typescript
export class TagParser {

  // Extract inline tags (#tag)
  parseInlineTags(content: string): string[] {
    const regex = /#([a-zA-Z0-9_/-]+)/g
    const tags: string[] = []
    let match

    while ((match = regex.exec(content)) !== null) {
      tags.push(match[1])
    }

    return Array.from(new Set(tags))  // Deduplicate
  }

  // Extract frontmatter tags
  parseFrontmatterTags(content: string): string[] {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/
    const match = content.match(frontmatterRegex)

    if (!match) return []

    const frontmatter = match[1]

    // YAML array format: tags: [a, b, c]
    const arrayMatch = frontmatter.match(/tags:\s*\[(.*?)\]/)
    if (arrayMatch) {
      return arrayMatch[1].split(',').map(t => t.trim())
    }

    // YAML list format:
    // tags:
    //   - a
    //   - b
    const listMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)+)/)
    if (listMatch) {
      return listMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean)
    }

    return []
  }

  // Get all tags for a note
  getAllTags(content: string): string[] {
    const inline = this.parseInlineTags(content)
    const frontmatter = this.parseFrontmatterTags(content)

    return Array.from(new Set([...inline, ...frontmatter]))
  }
}
```

### Tag Index

```typescript
@injectable()
export class TagIndexService {

  // Map: tag → notes that have it
  protected tagToNotes = new Map<string, Set<URI>>()

  // Map: note → tags it has
  protected noteToTags = new Map<string, string[]>()

  @inject(TagParser)
  protected readonly parser: TagParser

  @postConstruct()
  async init(): Promise<void> {
    await this.buildIndex()

    // Watch for changes
    this.workspace.onDidChangeTextDocument(event => {
      this.updateIndex(event.document.uri)
    })
  }

  async buildIndex(): Promise<void> {
    const files = await this.findAllMarkdownFiles()

    for (const file of files) {
      await this.indexFile(file)
    }
  }

  async indexFile(uri: URI): Promise<void> {
    const content = await this.readFile(uri)
    const tags = this.parser.getAllTags(content)

    // Update note → tags mapping
    this.noteToTags.set(uri.toString(), tags)

    // Update tag → notes mapping
    for (const tag of tags) {
      if (!this.tagToNotes.has(tag)) {
        this.tagToNotes.set(tag, new Set())
      }
      this.tagToNotes.get(tag)!.add(uri)
    }
  }

  getNotesWithTag(tag: string): URI[] {
    return Array.from(this.tagToNotes.get(tag) || [])
  }

  getAllTags(): string[] {
    return Array.from(this.tagToNotes.keys()).sort()
  }

  getTagCount(tag: string): number {
    return this.tagToNotes.get(tag)?.size || 0
  }
}
```

## Tag Browser Widget

### Tree View

```
┌─────────────────────────┐
│ 🏷️  Tags                │
├─────────────────────────┤
│ ▼ project (12)          │
│   ├─ app (5)            │
│   ├─ website (4)        │
│   └─ research (3)       │
│ ▼ status (8)            │
│   ├─ in-progress (5)    │
│   ├─ done (2)           │
│   └─ blocked (1)        │
│ ▶ design (6)            │
│ ▶ meeting (15)          │
└─────────────────────────┘
```

### Implementation

```typescript
export class TagBrowserWidget extends TreeWidget {

  static readonly ID = 'tag-browser'
  static readonly LABEL = 'Tags'

  @inject(TagIndexService)
  protected readonly tagIndex: TagIndexService

  @postConstruct()
  protected init(): void {
    this.id = TagBrowserWidget.ID
    this.title.label = TagBrowserWidget.LABEL
    this.title.iconClass = 'fa fa-tags'

    this.model = this.createTreeModel()
  }

  protected async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
    if (parent.id === 'root') {
      // Top level: all tags
      return this.getTopLevelTags()
    } else {
      // Nested: child tags
      return this.getChildTags(parent.id)
    }
  }

  protected getTopLevelTags(): TreeNode[] {
    const allTags = this.tagIndex.getAllTags()

    // Group by top-level tag
    const topLevel = new Set<string>()

    for (const tag of allTags) {
      const parts = tag.split('/')
      topLevel.add(parts[0])
    }

    return Array.from(topLevel).map(tag => ({
      id: tag,
      name: `${tag} (${this.tagIndex.getTagCount(tag)})`,
      icon: 'fa fa-tag',
      selected: false,
      expanded: false,
      children: this.hasChildTags(tag)
    }))
  }

  protected async onClickNode(node: TreeNode): Promise<void> {
    // Show notes with this tag
    const notes = this.tagIndex.getNotesWithTag(node.id)
    this.showNotesPanel(notes)
  }
}
```

## Tag Autocomplete

When typing `#`:

```typescript
export class TagCompletionProvider implements CompletionItemProvider {

  @inject(TagIndexService)
  protected readonly tagIndex: TagIndexService

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList> {

    // Detect if we just typed #
    const lineContent = model.getLineContent(position.lineNumber)
    const textBefore = lineContent.substring(0, position.column - 1)

    if (!textBefore.match(/#([a-zA-Z0-9_/-]*)$/)) {
      return { suggestions: [] }
    }

    // Get all existing tags
    const tags = this.tagIndex.getAllTags()

    // Create completion items
    const suggestions = tags.map(tag => ({
      label: tag,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: tag,
      detail: `${this.tagIndex.getTagCount(tag)} notes`,
      documentation: `Tag: #${tag}`
    }))

    return { suggestions }
  }
}
```

## Tag Search and Filtering

### Combine Tags

```
#project AND #in-progress
#bug OR #feature
#project NOT #archived
```

### Implementation

```typescript
export class TagSearchService {

  @inject(TagIndexService)
  protected readonly tagIndex: TagIndexService

  search(query: TagQuery): URI[] {
    if (query.operator === 'AND') {
      return this.searchAND(query.tags)
    } else if (query.operator === 'OR') {
      return this.searchOR(query.tags)
    } else if (query.operator === 'NOT') {
      return this.searchNOT(query.include, query.exclude)
    }

    // Single tag
    return this.tagIndex.getNotesWithTag(query.tags[0])
  }

  protected searchAND(tags: string[]): URI[] {
    // Notes that have ALL tags
    const sets = tags.map(tag => new Set(this.tagIndex.getNotesWithTag(tag)))

    return Array.from(sets[0]).filter(note =>
      sets.every(set => set.has(note))
    )
  }

  protected searchOR(tags: string[]): URI[] {
    // Notes that have ANY tag
    const result = new Set<URI>()

    for (const tag of tags) {
      for (const note of this.tagIndex.getNotesWithTag(tag)) {
        result.add(note)
      }
    }

    return Array.from(result)
  }

  protected searchNOT(include: string[], exclude: string[]): URI[] {
    // Notes with include tags but NOT exclude tags
    const included = new Set(this.searchOR(include))
    const excluded = new Set(this.searchOR(exclude))

    return Array.from(included).filter(note => !excluded.has(note))
  }
}
```

## Tag Cloud Visualization

```
         #project
    #meeting    #design
#in-progress #bug #feature
   #urgent     #archived
```

Size = frequency

```typescript
export class TagCloudWidget extends ReactWidget {

  protected render(): React.ReactNode {
    const tags = this.tagIndex.getAllTags()

    return <div className='tag-cloud'>
      {tags.map(tag => {
        const count = this.tagIndex.getTagCount(tag)
        const size = this.calculateSize(count)

        return <span
          key={tag}
          className='tag-cloud-item'
          style={{ fontSize: `${size}px` }}
          onClick={() => this.filterByTag(tag)}
        >
          #{tag}
        </span>
      })}
    </div>
  }

  protected calculateSize(count: number): number {
    const min = 12
    const max = 36
    const normalized = Math.log(count + 1) / Math.log(100)
    return min + (max - min) * normalized
  }
}
```

## Obsidian Comparison

**Obsidian Tags:**
- `#tag` syntax
- Frontmatter support
- Nested tags (`#parent/child`)
- Tag pane with counts
- Click tag → See all notes

**Our Implementation:**
- Identical feature set
- Integrated into [[Activity Bar]]
- Part of knowledge-first experience

## Progressive Disclosure

**Beginner:** Always visible (core KB feature)
**Intermediate:** Same
**Advanced:** Add tag search/filtering

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Activity Bar]]
- [[Wiki Links]]
- [[Daily Notes]]
- [[Knowledge Graph View]]
- [[Obsidian-Like Experience]]
