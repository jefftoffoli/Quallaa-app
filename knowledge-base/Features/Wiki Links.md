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
        const lineContent = model.getLineContent(position.lineNumber);
        const textBefore = lineContent.substring(0, position.column - 1);
        const match = textBefore.match(/\[\[([^\]]*)/);

        if (!match) {
            return { suggestions: [] };
        }

        // Find all notes
        const notes = await this.findAllNotes();

        // Create completion items
        const suggestions = notes.map(note => ({
            label: note.title,
            kind: monaco.languages.CompletionItemKind.Reference,
            insertText: note.title + ']]',
            detail: note.path,
            documentation: note.excerpt,
        }));

        return { suggestions };
    }
}
```

### Link Detection

```typescript
// Parse wiki links from markdown
function parseWikiLinks(content: string): WikiLink[] {
    const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    const links: WikiLink[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        links.push({
            target: match[1].trim(),
            alias: match[2]?.trim(),
            position: match.index,
        });
    }

    return links;
}
```

### Title Resolution

```typescript
// Find note file from title
async function resolveWikiLink(title: string): Promise<URI | undefined> {
    // Strategy 1: Exact filename match
    let match = await this.findFile(`${title}.md`);
    if (match) return match;

    // Strategy 2: Search for # Title in files
    const files = await this.findAllMarkdownFiles();
    for (const file of files) {
        const content = await this.readFile(file);
        const heading = content.match(/^#\s+(.+)$/m);
        if (heading && heading[1].trim() === title) {
            return file;
        }
    }

    return undefined; // Broken link
}
```

## Foam's Implementation

[[Foam Project Analysis]] has wiki link logic we can learn from:

**Decision:** Extract algorithm, not use as dependency

```typescript
// Our implementation, inspired by Foam's foam-core
export function parseWikiLinks(content: string): WikiLink[] {
    // Regex and logic extracted from Foam
    const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
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

## Link Validation and Maintenance

Wiki Links integrate with [[Knowledge Base Maintenance]] for automatic link
validation and health monitoring:

### Real-Time Link Validation

```typescript
@injectable()
export class WikiLinkValidator {
    @inject(WorkspaceService)
    protected readonly workspace: WorkspaceService;

    // Validate link as user types
    async validateLink(linkText: string): Promise<LinkValidation> {
        // Try to resolve the link
        const targets = await this.resolveWikiLink(linkText);

        if (targets.length === 0) {
            return {
                status: 'broken',
                message: 'Note not found',
                suggestions: await this.findSimilarNotes(linkText),
                actions: [
                    {
                        label: 'Create Note',
                        action: () => this.createNote(linkText),
                    },
                    {
                        label: 'Fix Typo',
                        action: () => this.showSuggestions(linkText),
                    },
                ],
            };
        }

        if (targets.length > 1) {
            return {
                status: 'ambiguous',
                message: `${targets.length} notes match`,
                suggestions: targets.map(t => t.path),
                actions: [
                    {
                        label: 'Disambiguate',
                        action: () => this.showDisambiguation(targets),
                    },
                ],
            };
        }

        return {
            status: 'valid',
            target: targets[0],
        };
    }
}
```

### Visual Link Indicators

```typescript
// Monaco decoration for link health
export class WikiLinkDecorator {
    decorateLinks(editor: monaco.editor.IStandaloneCodeEditor): void {
        const model = editor.getModel();
        if (!model) return;

        const content = model.getValue();
        const links = this.parseWikiLinks(content);

        const decorations: monaco.editor.IModelDeltaDecoration[] = [];

        for (const link of links) {
            const validation = await this.validator.validateLink(link.target);

            const className = this.getDecorationClass(validation.status);
            const hoverMessage = this.getHoverMessage(validation);

            decorations.push({
                range: new monaco.Range(
                    link.startLine,
                    link.startColumn,
                    link.endLine,
                    link.endColumn
                ),
                options: {
                    inlineClassName: className,
                    hoverMessage: { value: hoverMessage },
                },
            });
        }

        editor.deltaDecorations([], decorations);
    }

    protected getDecorationClass(status: LinkStatus): string {
        switch (status) {
            case 'valid':
                return 'wiki-link-valid';
            case 'broken':
                return 'wiki-link-broken';
            case 'ambiguous':
                return 'wiki-link-ambiguous';
            default:
                return 'wiki-link';
        }
    }
}
```

### CSS for Link Health

```css
/* Valid links - subtle underline */
.wiki-link-valid {
    text-decoration: underline;
    text-decoration-color: #22c55e;
    text-decoration-thickness: 1px;
    cursor: pointer;
}

/* Broken links - red wavy underline */
.wiki-link-broken {
    text-decoration: underline wavy;
    text-decoration-color: #ef4444;
    text-decoration-thickness: 2px;
    cursor: help;
}

/* Ambiguous links - orange dotted underline */
.wiki-link-ambiguous {
    text-decoration: underline dotted;
    text-decoration-color: #f97316;
    text-decoration-thickness: 2px;
    cursor: help;
}
```

### Quick Fixes for Broken Links

```typescript
export class WikiLinkCodeActions
    implements monaco.languages.CodeActionProvider
{
    async provideCodeActions(
        model: monaco.editor.ITextModel,
        range: monaco.Range
    ): Promise<monaco.languages.CodeActionList> {
        const linkAtCursor = this.getLinkAtPosition(model, range);
        if (!linkAtCursor) return { actions: [], dispose: () => {} };

        const validation = await this.validator.validateLink(
            linkAtCursor.target
        );

        if (validation.status === 'broken') {
            const actions: monaco.languages.CodeAction[] = [];

            // Action: Create the missing note
            actions.push({
                title: `Create note "${linkAtCursor.target}"`,
                kind: 'quickfix',
                edit: undefined,
                command: {
                    id: 'knowledge-base.createNote',
                    title: 'Create Note',
                    arguments: [linkAtCursor.target],
                },
            });

            // Actions: Fix with suggestions
            for (const suggestion of validation.suggestions || []) {
                actions.push({
                    title: `Change to "${suggestion}"`,
                    kind: 'quickfix',
                    edit: {
                        edits: [
                            {
                                resource: model.uri,
                                edit: {
                                    range: linkAtCursor.range,
                                    text: `[[${suggestion}]]`,
                                },
                            },
                        ],
                    },
                });
            }

            // Action: Remove the link
            actions.push({
                title: 'Remove link',
                kind: 'quickfix',
                edit: {
                    edits: [
                        {
                            resource: model.uri,
                            edit: {
                                range: linkAtCursor.range,
                                text: linkAtCursor.target, // Just the text, no [[ ]]
                            },
                        },
                    ],
                },
            });

            return { actions, dispose: () => {} };
        }

        return { actions: [], dispose: () => {} };
    }
}
```

### Batch Link Updates

```typescript
// Update all links when note is renamed
@injectable()
export class WikiLinkRefactorService {
    @inject(WorkspaceService)
    protected readonly workspace: WorkspaceService;

    async renameNote(oldTitle: string, newTitle: string): Promise<void> {
        // Find all files that link to this note
        const backlinks = await this.findBacklinks(oldTitle);

        // Update each link
        const edits: WorkspaceEdit = {
            changes: new Map(),
        };

        for (const backlink of backlinks) {
            const file = backlink.sourceFile;
            const content = await this.readFile(file);

            // Replace all occurrences of [[oldTitle]]
            const updated = content.replace(
                new RegExp(
                    `\\[\\[${this.escapeRegex(oldTitle)}(\\|[^\\]]+)?\\]\\]`,
                    'g'
                ),
                (match, alias) => `[[${newTitle}${alias || ''}]]`
            );

            if (!edits.changes.has(file.toString())) {
                edits.changes.set(file.toString(), []);
            }

            edits.changes.get(file.toString())!.push({
                range: this.getFullRange(content),
                newText: updated,
            });
        }

        // Apply all edits
        await this.workspaceService.applyEdit(edits);

        // Notify user
        this.notificationService.info(
            `Updated ${backlinks.length} links to "${newTitle}"`
        );
    }
}
```

### Link Health Dashboard

```typescript
export class LinkHealthWidget extends ReactWidget {
  static readonly ID = 'link-health'
  static readonly LABEL = 'Link Health'

  @inject(WikiLinkValidator)
  protected readonly validator: WikiLinkValidator

  protected render(): React.ReactNode {
    const stats = this.calculateLinkStats()

    return (
      <div className="link-health-dashboard">
        <h3>Link Health Summary</h3>

        <div className="stats-grid">
          <StatCard
            label="Total Links"
            value={stats.total}
            icon="fa-link"
          />
          <StatCard
            label="Valid"
            value={stats.valid}
            percentage={(stats.valid / stats.total) * 100}
            status="success"
            icon="fa-check"
          />
          <StatCard
            label="Broken"
            value={stats.broken}
            percentage={(stats.broken / stats.total) * 100}
            status="error"
            icon="fa-times"
          />
          <StatCard
            label="Ambiguous"
            value={stats.ambiguous}
            percentage={(stats.ambiguous / stats.total) * 100}
            status="warning"
            icon="fa-question"
          />
        </div>

        {stats.broken > 0 && (
          <div className="actions">
            <button onClick={() => this.fixAllBroken()}>
              Fix All Broken Links
            </button>
            <button onClick={() => this.showBrokenLinks()}>
              View Details
            </button>
          </div>
        )}
      </div>
    )
  }

  protected async calculateLinkStats(): Promise<LinkStats> {
    const allLinks = await this.findAllWikiLinks()

    let valid = 0, broken = 0, ambiguous = 0

    for (const link of allLinks) {
      const validation = await this.validator.validateLink(link.target)

      switch (validation.status) {
        case 'valid': valid++; break
        case 'broken': broken++; break
        case 'ambiguous': ambiguous++; break
      }
    }

    return {
      total: allLinks.length,
      valid,
      broken,
      ambiguous
    }
  }
}
```

## Automated Link Suggestions

When editing a note, suggest potential wiki links:

```typescript
export class WikiLinkSuggestionService {
    // Analyze content and suggest where to add links
    async suggestLinks(content: string): Promise<LinkSuggestion[]> {
        const suggestions: LinkSuggestion[] = [];
        const allNotes = await this.getAllNotes();

        for (const note of allNotes) {
            // Check if note title appears in content but isn't linked
            const regex = new RegExp(
                `\\b${this.escapeRegex(note.title)}\\b`,
                'gi'
            );
            let match;

            while ((match = regex.exec(content)) !== null) {
                // Skip if already inside a wiki link
                if (this.isInsideWikiLink(content, match.index)) {
                    continue;
                }

                suggestions.push({
                    position: match.index,
                    length: match[0].length,
                    originalText: match[0],
                    targetNote: note.title,
                    confidence: this.calculateConfidence(
                        content,
                        match.index,
                        note
                    ),
                });
            }
        }

        // Sort by confidence
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    // Show suggestions as code lens
    async provideCodeLenses(
        model: monaco.editor.ITextModel
    ): Promise<monaco.languages.CodeLensList> {
        const content = model.getValue();
        const suggestions = await this.suggestLinks(content);

        const lenses: monaco.languages.CodeLens[] = [];

        for (const suggestion of suggestions.slice(0, 10)) {
            // Top 10
            const position = model.getPositionAt(suggestion.position);

            lenses.push({
                range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column + suggestion.length
                ),
                command: {
                    id: 'knowledge-base.createWikiLink',
                    title: `🔗 Link to "${suggestion.targetNote}"`,
                    arguments: [suggestion],
                },
            });
        }

        return { lenses, dispose: () => {} };
    }
}
```

## Related Concepts

- [[Backlinks Panel]]
- [[Knowledge Graph View]]
- [[Quick Switcher]]
- [[Foam Project Analysis]]
- [[Obsidian-Like Experience]]
- [[Knowledge Base Maintenance]]
- [[Knowledge Graph Health Metrics]]
- [[AI Deletion Agents]]
