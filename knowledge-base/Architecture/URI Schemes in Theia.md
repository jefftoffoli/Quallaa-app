# URI Schemes in Theia

## What They Are

**URI Schemes** = Prefixes that indicate how to handle a resource

Format: `scheme://path?query#fragment`

## Physical Metaphor

**Phone Number Prefixes**

```
1-800-... → Toll-free number
1-900-... → Premium rate
+44-... → UK number

Similarly:
file://... → Local file
http://... → Web resource
diff://... → Diff view
preview://... → Preview pane
```

## Built-in Schemes

### file://

Local filesystem:

```
file:///Users/you/workspace/note.md
```

### http:// and https://

Web resources:

```
https://github.com/theia-ide/theia
```

### diff://

Diff view (compare two files):

```
diff://label?["file1","file2"]
```

See: [[Diff Editor Architecture]]

### preview://

Preview pane:

```
preview://file:///workspace/note.md?viewer=markdown
```

## Custom Schemes

### wiki://

For [[Wiki Links]]:

```typescript
// [[Note Title]] becomes wiki://Note%20Title

@injectable()
export class WikiLinkOpenHandler implements OpenHandler {

  readonly id = 'wiki-link-handler'

  canHandle(uri: URI): number {
    return uri.scheme === 'wiki' ? 1000 : 0
  }

  async open(uri: URI): Promise<Widget> {
    // Decode note title
    const noteTitle = decodeURIComponent(uri.path.toString())

    // Find actual file
    const file = await this.resolveWikiLink(noteTitle)

    // Open file
    return this.openerService.open(file)
  }

  protected async resolveWikiLink(title: string): Promise<URI> {
    // Strategy 1: Exact filename match
    const exact = await this.findFile(`${title}.md`)
    if (exact) return exact

    // Strategy 2: Search for # Title heading
    const byHeading = await this.findFileByHeading(title)
    if (byHeading) return byHeading

    // Strategy 3: Create new note
    return this.createNote(title)
  }
}
```

### Usage in Editor

```typescript
// When rendering [[Note Title]], create wiki:// link
<a href="wiki://Note%20Title">Note Title</a>

// Click triggers OpenerService → WikiLinkOpenHandler
```

### graph://

For [[Knowledge Graph View]]:

```
graph://                  → Global graph
graph://Note%20Title      → Local graph (centered on note)
graph://tag/project       → Graph filtered by tag
```

### daily://

For [[Daily Notes]]:

```
daily://                  → Today's note
daily://2025-01-15        → Specific date
daily://offset/-1         → Yesterday
daily://offset/1          → Tomorrow
```

## URI Encoding/Decoding

### Encoding

```typescript
function createWikiLinkURI(noteTitle: string): URI {
  // Encode spaces and special characters
  const encoded = encodeURIComponent(noteTitle)
  return new URI(`wiki://${encoded}`)
}

// "Project Ideas" → "wiki://Project%20Ideas"
```

### Decoding

```typescript
function parseWikiLinkURI(uri: URI): string {
  if (uri.scheme !== 'wiki') {
    throw new Error('Not a wiki link')
  }

  // Decode back to readable title
  return decodeURIComponent(uri.path.toString())
}

// "wiki://Project%20Ideas" → "Project Ideas"
```

## Query Parameters

### preview://

```
preview://file:///note.md?viewer=markdown&line=42

Query params:
  - viewer: Which viewer to use
  - line: Jump to specific line
```

### diff://

```
diff://Compare?["file1","file2"]&mode=side-by-side

Query params:
  - mode: side-by-side | inline
```

## Implementation Details

### URI Class

Theia uses a `URI` class:

```typescript
import { URI } from '@theia/core'

const uri = new URI('file:///workspace/note.md')

uri.scheme    // "file"
uri.path      // Path("/workspace/note.md")
uri.toString() // "file:///workspace/note.md"
```

### Creating URIs

```typescript
// From string
const uri = new URI('file:///workspace/note.md')

// With custom scheme
const wikiUri = new URI('wiki://Note%20Title')

// Resolving relative paths
const workspace = new URI('file:///workspace')
const note = workspace.resolve('notes/idea.md')
// → file:///workspace/notes/idea.md
```

### Comparing URIs

```typescript
uri1.isEqual(uri2)  // Check equality
uri1.toString() === uri2.toString()  // Alternative
```

## Location in Code

**URI Class:**
`node_modules/@theia/core/lib/common/uri.js`

**Diff URIs:**
`node_modules/@theia/core/lib/browser/diff-uris.js`

**Preview URIs:**
`node_modules/@theia/preview/lib/browser/preview-uri.js`

## Our Custom URI Schemes

### wiki://

**Purpose:** Link between notes
**Handler:** WikiLinkOpenHandler (to implement)
**Example:** `wiki://Project%20Ideas`

### daily://

**Purpose:** Daily notes navigation
**Handler:** DailyNotesOpenHandler (to implement)
**Example:** `daily://2025-01-15`

### graph://

**Purpose:** Graph view deep links
**Handler:** GraphViewOpenHandler (to implement)
**Example:** `graph://tag/project`

### tag://

**Purpose:** Show all notes with tag
**Handler:** TagViewOpenHandler (to implement)
**Example:** `tag://project`

## Registration Example

```typescript
@injectable()
export class CustomURIHandlersModule implements ContainerModule {

  configure(): void {
    // Register wiki:// handler
    bind(OpenHandler).to(WikiLinkOpenHandler).inSingletonScope()

    // Register daily:// handler
    bind(OpenHandler).to(DailyNotesOpenHandler).inSingletonScope()

    // Register graph:// handler
    bind(OpenHandler).to(GraphViewOpenHandler).inSingletonScope()

    // Register tag:// handler
    bind(OpenHandler).to(TagViewOpenHandler).inSingletonScope()
  }
}
```

## Benefits

### 1. Decoupling

URI scheme decouples link from implementation:

```markdown
See [[Note Title]]

↓ Becomes:

<a href="wiki://Note%20Title">

↓ Handler resolves:

file:///workspace/notes/note-title.md
```

### 2. Flexibility

Can change resolution logic without changing links:

```typescript
// V1: Notes in flat structure
wiki://Project → /workspace/Project.md

// V2: Notes in folders
wiki://Project → /workspace/projects/project.md
```

### 3. Virtual Resources

Create URIs that don't correspond to files:

```typescript
// graph:// doesn't point to file, generates view on-the-fly
graph://Project%20Ideas
  → Handler builds graph centered on that note
```

## Related Concepts

- [[OpenerService]]
- [[OpenHandler Priority System]]
- [[Diff Editor Architecture]]
- [[Wiki Links]]
- [[Daily Notes]]
- [[Knowledge Graph View]]
