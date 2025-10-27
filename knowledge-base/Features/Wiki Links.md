# Wiki Links

## What They Are

**Wiki Links** = `[[Note Name]]` syntax for linking between notes

Popularized by Wikipedia, adopted by Obsidian, Roam Research, and Foam.

## Syntax

### Basic Link
```markdown
I'm working on [[Project Ideas]]
```

Links to note titled "Project Ideas" (or file named `Project Ideas.md`)

### Link with Alias
```markdown
See the [[Project Ideas|ideas doc]] for details
```

Displays as "ideas doc" but links to "Project Ideas"

### Link with Header
```markdown
Check out [[Project Ideas#Next Steps]]
```

Links to specific section within note

## How They Work

### 1. Autocomplete While Typing

```
User types: [[Pro
System shows:
  ├─ 📝 Project Ideas
  ├─ 📝 Product Roadmap
  └─ 📝 Programming Notes
```

See implementation: [[How to Implement Wiki Link Autocomplete]]

### 2. Navigation

- **Cmd+Click** on link → Opens note
- **Cmd+Hover** on link → Shows preview
- Broken links shown in different color

### 3. Backlink Detection

When note A links to note B:
- Note B shows "Linked from: A" in [[Backlinks Panel]]
- Bidirectional relationship tracked
- [[Knowledge Graph View]] shows connection

## Implementation in Theia

### Monaco Completion Provider

```typescript
@injectable()
export class WikiLinkCompletionProvider implements CompletionItemProvider {
  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList> {

    // Detect if we're inside [[
    const lineContent = model.getLineContent(position.lineNumber)
    const textBefore = lineContent.substring(0, position.column - 1)
    const match = textBefore.match(/\[\[([^\]]*)/)

    if (!match) {
      return { suggestions: [] }
    }

    // Find all notes
    const notes = await this.findAllNotes()

    // Create completion items
    const suggestions = notes.map(note => ({
      label: note.title,
      kind: monaco.languages.CompletionItemKind.Reference,
      insertText: note.title + ']]',
      detail: note.path,
      documentation: note.excerpt
    }))

    return { suggestions }
  }
}
```

### Link Detection

```typescript
// Parse wiki links from markdown
function parseWikiLinks(content: string): WikiLink[] {
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  const links: WikiLink[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    links.push({
      target: match[1].trim(),
      alias: match[2]?.trim(),
      position: match.index
    })
  }

  return links
}
```

### Title Resolution

```typescript
// Find note file from title
async function resolveWikiLink(title: string): Promise<URI | undefined> {
  // Strategy 1: Exact filename match
  let match = await this.findFile(`${title}.md`)
  if (match) return match

  // Strategy 2: Search for # Title in files
  const files = await this.findAllMarkdownFiles()
  for (const file of files) {
    const content = await this.readFile(file)
    const heading = content.match(/^#\s+(.+)$/m)
    if (heading && heading[1].trim() === title) {
      return file
    }
  }

  return undefined  // Broken link
}
```

## Foam's Implementation

[[Foam Project Analysis]] has wiki link logic we can learn from:

**Decision:** Extract algorithm, not use as dependency

```typescript
// Our implementation, inspired by Foam's foam-core
export function parseWikiLinks(content: string): WikiLink[] {
  // Regex and logic extracted from Foam
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  // ... implementation
}
```

We'll study their implementation and adapt it for our needs.

## Benefits

### 1. Frictionless Linking
No need to remember file paths, just note titles

### 2. Refactor-Friendly
Rename file → Links update automatically (if implemented)

### 3. Network Effect
More links → More valuable graph

### 4. Discoverability
[[Backlinks Panel]] shows what links to current note

## Challenges

### 1. Ambiguous Titles
What if two notes have same title?

**Solution:** Disambiguate with path
```markdown
[[Projects/Ideas]] vs [[Archive/Ideas]]
```

### 2. Broken Links
What if linked note doesn't exist?

**Solution:**
- Show in different color
- Offer to create on click
- Track in "orphan links" view

### 3. Performance
Scanning all files for every autocomplete

**Solution:**
- Index notes on startup
- Update index on file changes
- Cache title → file mapping

## Related Concepts

- [[Backlinks Panel]]
- [[Knowledge Graph View]]
- [[Quick Switcher]]
- [[Foam Project Analysis]]
- [[Obsidian-Like Experience]]
