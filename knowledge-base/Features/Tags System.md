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
#project/app #project/website #project/research

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
        const regex = /#([a-zA-Z0-9_/-]+)/g;
        const tags: string[] = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            tags.push(match[1]);
        }

        return Array.from(new Set(tags)); // Deduplicate
    }

    // Extract frontmatter tags
    parseFrontmatterTags(content: string): string[] {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);

        if (!match) return [];

        const frontmatter = match[1];

        // YAML array format: tags: [a, b, c]
        const arrayMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
        if (arrayMatch) {
            return arrayMatch[1].split(',').map(t => t.trim());
        }

        // YAML list format:
        // tags:
        //   - a
        //   - b
        const listMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)+)/);
        if (listMatch) {
            return listMatch[1]
                .split('\n')
                .map(line => line.replace(/^\s*-\s*/, '').trim())
                .filter(Boolean);
        }

        return [];
    }

    // Get all tags for a note
    getAllTags(content: string): string[] {
        const inline = this.parseInlineTags(content);
        const frontmatter = this.parseFrontmatterTags(content);

        return Array.from(new Set([...inline, ...frontmatter]));
    }
}
```

### Tag Index

```typescript
@injectable()
export class TagIndexService {
    // Map: tag → notes that have it
    protected tagToNotes = new Map<string, Set<URI>>();

    // Map: note → tags it has
    protected noteToTags = new Map<string, string[]>();

    @inject(TagParser)
    protected readonly parser: TagParser;

    @postConstruct()
    async init(): Promise<void> {
        await this.buildIndex();

        // Watch for changes
        this.workspace.onDidChangeTextDocument(event => {
            this.updateIndex(event.document.uri);
        });
    }

    async buildIndex(): Promise<void> {
        const files = await this.findAllMarkdownFiles();

        for (const file of files) {
            await this.indexFile(file);
        }
    }

    async indexFile(uri: URI): Promise<void> {
        const content = await this.readFile(uri);
        const tags = this.parser.getAllTags(content);

        // Update note → tags mapping
        this.noteToTags.set(uri.toString(), tags);

        // Update tag → notes mapping
        for (const tag of tags) {
            if (!this.tagToNotes.has(tag)) {
                this.tagToNotes.set(tag, new Set());
            }
            this.tagToNotes.get(tag)!.add(uri);
        }
    }

    getNotesWithTag(tag: string): URI[] {
        return Array.from(this.tagToNotes.get(tag) || []);
    }

    getAllTags(): string[] {
        return Array.from(this.tagToNotes.keys()).sort();
    }

    getTagCount(tag: string): number {
        return this.tagToNotes.get(tag)?.size || 0;
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
    static readonly ID = 'tag-browser';
    static readonly LABEL = 'Tags';

    @inject(TagIndexService)
    protected readonly tagIndex: TagIndexService;

    @postConstruct()
    protected init(): void {
        this.id = TagBrowserWidget.ID;
        this.title.label = TagBrowserWidget.LABEL;
        this.title.iconClass = 'fa fa-tags';

        this.model = this.createTreeModel();
    }

    protected async resolveChildren(
        parent: CompositeTreeNode
    ): Promise<TreeNode[]> {
        if (parent.id === 'root') {
            // Top level: all tags
            return this.getTopLevelTags();
        } else {
            // Nested: child tags
            return this.getChildTags(parent.id);
        }
    }

    protected getTopLevelTags(): TreeNode[] {
        const allTags = this.tagIndex.getAllTags();

        // Group by top-level tag
        const topLevel = new Set<string>();

        for (const tag of allTags) {
            const parts = tag.split('/');
            topLevel.add(parts[0]);
        }

        return Array.from(topLevel).map(tag => ({
            id: tag,
            name: `${tag} (${this.tagIndex.getTagCount(tag)})`,
            icon: 'fa fa-tag',
            selected: false,
            expanded: false,
            children: this.hasChildTags(tag),
        }));
    }

    protected async onClickNode(node: TreeNode): Promise<void> {
        // Show notes with this tag
        const notes = this.tagIndex.getNotesWithTag(node.id);
        this.showNotesPanel(notes);
    }
}
```

## Tag Autocomplete

When typing `#`:

```typescript
export class TagCompletionProvider implements CompletionItemProvider {
    @inject(TagIndexService)
    protected readonly tagIndex: TagIndexService;

    async provideCompletionItems(
        model: monaco.editor.ITextModel,
        position: monaco.Position
    ): Promise<monaco.languages.CompletionList> {
        // Detect if we just typed #
        const lineContent = model.getLineContent(position.lineNumber);
        const textBefore = lineContent.substring(0, position.column - 1);

        if (!textBefore.match(/#([a-zA-Z0-9_/-]*)$/)) {
            return { suggestions: [] };
        }

        // Get all existing tags
        const tags = this.tagIndex.getAllTags();

        // Create completion items
        const suggestions = tags.map(tag => ({
            label: tag,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: tag,
            detail: `${this.tagIndex.getTagCount(tag)} notes`,
            documentation: `Tag: #${tag}`,
        }));

        return { suggestions };
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
    protected readonly tagIndex: TagIndexService;

    search(query: TagQuery): URI[] {
        if (query.operator === 'AND') {
            return this.searchAND(query.tags);
        } else if (query.operator === 'OR') {
            return this.searchOR(query.tags);
        } else if (query.operator === 'NOT') {
            return this.searchNOT(query.include, query.exclude);
        }

        // Single tag
        return this.tagIndex.getNotesWithTag(query.tags[0]);
    }

    protected searchAND(tags: string[]): URI[] {
        // Notes that have ALL tags
        const sets = tags.map(
            tag => new Set(this.tagIndex.getNotesWithTag(tag))
        );

        return Array.from(sets[0]).filter(note =>
            sets.every(set => set.has(note))
        );
    }

    protected searchOR(tags: string[]): URI[] {
        // Notes that have ANY tag
        const result = new Set<URI>();

        for (const tag of tags) {
            for (const note of this.tagIndex.getNotesWithTag(tag)) {
                result.add(note);
            }
        }

        return Array.from(result);
    }

    protected searchNOT(include: string[], exclude: string[]): URI[] {
        // Notes with include tags but NOT exclude tags
        const included = new Set(this.searchOR(include));
        const excluded = new Set(this.searchOR(exclude));

        return Array.from(included).filter(note => !excluded.has(note));
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

**Beginner:** Always visible (core KB feature) **Intermediate:** Same
**Advanced:** Add tag search/filtering

## Tag Maintenance and Cleanup

The Tags System integrates with [[Knowledge Base Maintenance]] to help manage
and clean up tags over time:

### Duplicate Tag Detection

```typescript
@injectable()
export class TagMaintenanceService {
    @inject(TagIndexService)
    protected readonly tagIndex: TagIndexService;

    // Find similar tags that should be merged
    async findDuplicateTags(): Promise<TagDuplicateGroup[]> {
        const allTags = this.tagIndex.getAllTags();
        const groups: TagDuplicateGroup[] = [];

        for (let i = 0; i < allTags.length; i++) {
            for (let j = i + 1; j < allTags.length; j++) {
                const tagA = allTags[i];
                const tagB = allTags[j];

                // Check lexical similarity
                const similarity = this.calculateSimilarity(tagA, tagB);

                if (similarity > 0.85) {
                    groups.push({
                        tags: [tagA, tagB],
                        similarity,
                        suggestion: this.suggestCanonical(tagA, tagB),
                    });
                }
            }
        }

        return groups.sort((a, b) => b.similarity - a.similarity);
    }

    // Examples of duplicates:
    // - "project" vs "projects"
    // - "in-progress" vs "in_progress"
    // - "meeting" vs "meetings"
    // - "todo" vs "TODO" vs "ToDo"

    protected calculateSimilarity(tagA: string, tagB: string): number {
        // Normalize for comparison
        const normA = this.normalize(tagA);
        const normB = this.normalize(tagB);

        // Levenshtein distance
        const distance = this.levenshtein(normA, normB);
        const maxLength = Math.max(normA.length, normB.length);

        return 1 - distance / maxLength;
    }

    protected normalize(tag: string): string {
        return tag
            .toLowerCase()
            .replace(/[-_]/g, '') // Remove separators
            .replace(/s$/, ''); // Remove plural 's'
    }

    protected suggestCanonical(tagA: string, tagB: string): string {
        // Prefer:
        // 1. More frequently used tag
        const countA = this.tagIndex.getTagCount(tagA);
        const countB = this.tagIndex.getTagCount(tagB);

        if (countA > countB) return tagA;
        if (countB > countA) return tagB;

        // 2. Lowercase over mixed case
        if (tagA === tagA.toLowerCase() && tagB !== tagB.toLowerCase()) {
            return tagA;
        }

        // 3. Hyphens over underscores
        if (tagA.includes('-') && tagB.includes('_')) {
            return tagA;
        }

        // 4. Alphabetically first
        return tagA < tagB ? tagA : tagB;
    }
}
```

### Tag Merge Tool

```typescript
export class TagMergeWidget extends ReactWidget {
  @inject(TagMaintenanceService)
  protected readonly maintenance: TagMaintenanceService

  protected render(): React.ReactNode {
    const duplicates = this.findDuplicateTags()

    if (duplicates.length === 0) {
      return <div className="no-duplicates">
        <i className="fa fa-check-circle" />
        <h3>No Duplicate Tags Found</h3>
        <p>All tags are unique.</p>
      </div>
    }

    return (
      <div className="tag-merge-tool">
        <h3>Duplicate Tags ({duplicates.length})</h3>

        {duplicates.map(group => (
          <div key={group.tags.join('-')} className="duplicate-group">
            <div className="tags">
              {group.tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag} ({this.tagIndex.getTagCount(tag)})
                </span>
              ))}
            </div>

            <div className="similarity">
              {(group.similarity * 100).toFixed(0)}% similar
            </div>

            <div className="suggestion">
              <strong>Suggested merge:</strong> #{group.suggestion}
            </div>

            <div className="actions">
              <button onClick={() => this.mergeTags(group)}>
                Merge Tags
              </button>
              <button onClick={() => this.ignoreDuplicate(group)}>
                Ignore
              </button>
            </div>
          </div>
        ))}

        <div className="bulk-actions">
          <button onClick={() => this.mergeAll()}>
            Merge All Suggestions
          </button>
        </div>
      </div>
    )
  }

  protected async mergeTags(group: TagDuplicateGroup): Promise<void> {
    const canonical = group.suggestion
    const toMerge = group.tags.filter(t => t !== canonical)

    // Find all notes with tags to merge
    const notesToUpdate: Map<URI, string[]> = new Map()

    for (const tag of toMerge) {
      const notes = this.tagIndex.getNotesWithTag(tag)

      for (const note of notes) {
        if (!notesToUpdate.has(note)) {
          notesToUpdate.set(note, [])
        }
        notesToUpdate.get(note)!.push(tag)
      }
    }

    // Update each note
    for (const [noteUri, tagsToReplace] of notesToUpdate) {
      await this.replaceTagsInNote(noteUri, tagsToReplace, canonical)
    }

    // Refresh index
    await this.tagIndex.buildIndex()

    // Notify user
    this.messageService.info(
      `Merged ${toMerge.length} tags into #${canonical}`
    )
  }

  protected async replaceTagsInNote(
    uri: URI,
    oldTags: string[],
    newTag: string
  ): Promise<void> {
    let content = await this.readFile(uri)

    for (const oldTag of oldTags) {
      // Replace inline tags
      content = content.replace(
        new RegExp(`#${this.escapeRegex(oldTag)}\\b`, 'g'),
        `#${newTag}`
      )

      // Replace frontmatter tags
      content = this.replaceFrontmatterTag(content, oldTag, newTag)
    }

    await this.writeFile(uri, content)
  }
}
```

### Unused Tag Detection

```typescript
export class UnusedTagDetector {
    @inject(TagIndexService)
    protected readonly tagIndex: TagIndexService;

    // Find tags with very few uses
    async findUnusedTags(threshold: number = 3): Promise<UnusedTag[]> {
        const allTags = this.tagIndex.getAllTags();
        const unused: UnusedTag[] = [];

        for (const tag of allTags) {
            const count = this.tagIndex.getTagCount(tag);

            if (count < threshold) {
                const notes = this.tagIndex.getNotesWithTag(tag);

                unused.push({
                    tag,
                    count,
                    notes,
                    suggestion: this.suggestAlternative(tag, allTags),
                });
            }
        }

        return unused.sort((a, b) => a.count - b.count);
    }

    protected suggestAlternative(
        unusedTag: string,
        allTags: string[]
    ): string | undefined {
        // Find similar tags with more usage
        let bestMatch: string | undefined;
        let bestScore = 0;

        for (const tag of allTags) {
            if (tag === unusedTag) continue;

            const count = this.tagIndex.getTagCount(tag);
            if (count < 5) continue; // Must have reasonable usage

            const similarity = this.calculateSimilarity(unusedTag, tag);

            if (similarity > 0.7 && similarity > bestScore) {
                bestScore = similarity;
                bestMatch = tag;
            }
        }

        return bestMatch;
    }
}
```

### Tag Cleanup Dashboard

```typescript
export class TagCleanupWidget extends ReactWidget {
  static readonly ID = 'tag-cleanup'
  static readonly LABEL = 'Tag Cleanup'

  protected render(): React.ReactNode {
    const duplicates = this.findDuplicateTags()
    const unused = this.findUnusedTags()
    const orphaned = this.findOrphanedTags()

    return (
      <div className="tag-cleanup-dashboard">
        <h2>Tag Maintenance</h2>

        <div className="stats-summary">
          <StatCard
            label="Total Tags"
            value={this.tagIndex.getAllTags().length}
            icon="fa-tags"
          />
          <StatCard
            label="Duplicates"
            value={duplicates.length}
            status={duplicates.length > 0 ? 'warning' : 'success'}
            icon="fa-copy"
          />
          <StatCard
            label="Rarely Used"
            value={unused.length}
            status={unused.length > 5 ? 'warning' : 'success'}
            icon="fa-exclamation-triangle"
          />
        </div>

        <Tabs>
          <Tab label="Duplicates" count={duplicates.length}>
            <TagMergePanel duplicates={duplicates} />
          </Tab>

          <Tab label="Rarely Used" count={unused.length}>
            <UnusedTagsPanel unused={unused} />
          </Tab>

          <Tab label="Organization">
            <TagOrganizationPanel />
          </Tab>
        </Tabs>
      </div>
    )
  }
}
```

### Tag Hierarchy Suggestions

```typescript
export class TagHierarchyAnalyzer {
    // Suggest nested tag structures based on usage patterns
    async suggestHierarchy(): Promise<TagHierarchySuggestion[]> {
        const allTags = this.tagIndex.getAllTags();
        const suggestions: TagHierarchySuggestion[] = [];

        // Find tags that frequently co-occur
        const coOccurrence = await this.analyzeCoOccurrence();

        for (const [tagA, tagB, frequency] of coOccurrence) {
            // If tags often appear together, suggest hierarchy
            if (frequency > 0.7) {
                // 70% co-occurrence
                // Check if one is more general
                if (this.isMoreGeneral(tagA, tagB)) {
                    suggestions.push({
                        parent: tagA,
                        child: tagB,
                        frequency,
                        suggestion: `Consider using #${tagA}/${tagB} instead of separate tags`,
                    });
                }
            }
        }

        return suggestions;
    }

    protected async analyzeCoOccurrence(): Promise<[string, string, number][]> {
        const allTags = this.tagIndex.getAllTags();
        const pairs: [string, string, number][] = [];

        for (let i = 0; i < allTags.length; i++) {
            for (let j = i + 1; j < allTags.length; j++) {
                const tagA = allTags[i];
                const tagB = allTags[j];

                const notesA = new Set(this.tagIndex.getNotesWithTag(tagA));
                const notesB = new Set(this.tagIndex.getNotesWithTag(tagB));

                // Count intersection
                const intersection = new Set(
                    Array.from(notesA).filter(n => notesB.has(n))
                );

                // Calculate frequency
                const frequency =
                    intersection.size / Math.min(notesA.size, notesB.size);

                if (frequency > 0.3) {
                    // At least 30% co-occurrence
                    pairs.push([tagA, tagB, frequency]);
                }
            }
        }

        return pairs.sort((a, b) => b[2] - a[2]); // Sort by frequency
    }

    protected isMoreGeneral(tagA: string, tagB: string): boolean {
        // Heuristics for determining if tagA is more general than tagB
        // 1. Shorter tags are often more general
        if (tagA.length < tagB.length - 3) return true;

        // 2. tagB contains tagA
        if (tagB.includes(tagA)) return true;

        // 3. tagA is used more frequently
        const countA = this.tagIndex.getTagCount(tagA);
        const countB = this.tagIndex.getTagCount(tagB);
        if (countA > countB * 1.5) return true;

        return false;
    }
}
```

### Automated Tag Cleanup

```typescript
export class TagCleanupAutomation {
    // Run periodic tag maintenance
    async runAutomatedCleanup(): Promise<CleanupReport> {
        const report: CleanupReport = {
            duplicatesMerged: 0,
            unusedRemoved: 0,
            hierarchiesCreated: 0,
            timestamp: Date.now(),
        };

        // 1. Merge obvious duplicates (>95% similarity, low risk)
        const duplicates = await this.maintenance.findDuplicateTags();
        const obviousDuplicates = duplicates.filter(g => g.similarity > 0.95);

        for (const group of obviousDuplicates) {
            await this.mergeTags(group);
            report.duplicatesMerged++;
        }

        // 2. Remove tags used only once (with user confirmation)
        const unused = await this.detector.findUnusedTags(1);

        for (const tag of unused) {
            const shouldRemove = await this.confirmRemoval(tag);
            if (shouldRemove) {
                await this.removeTag(tag.tag);
                report.unusedRemoved++;
            }
        }

        // 3. Suggest hierarchies
        const hierarchies = await this.analyzer.suggestHierarchy();
        // Present to user (don't auto-apply)

        return report;
    }
}
```

## Maintenance Features

### Merge Duplicate Tags

```
Tag Cleanup Dashboard shows:

🔁 Duplicates Found (5)

  #project (12 notes) ≈ #projects (8 notes)
  Similarity: 95%
  Suggestion: Merge into #project
  [Merge] [Ignore]

  #todo (15 notes) ≈ #TODO (3 notes)
  Similarity: 100%
  Suggestion: Merge into #todo
  [Merge] [Ignore]

[Merge All] [Review Later]
```

### Clean Up Unused Tags

```
📊 Rarely Used Tags (8)

  #temp (1 note) - Created 6 months ago
  Similar to: #temporary (15 notes)
  [Merge] [Remove] [Keep]

  #old-idea (2 notes) - Last used 1 year ago
  [Archive Notes] [Remove Tag] [Keep]
```

### Suggest Tag Hierarchy

```
🌳 Organization Suggestions

  #project and #app appear together in 85% of notes
  💡 Consider: #project/app

  #status and #in-progress appear together in 72% of notes
  💡 Consider: #status/in-progress

[Apply Suggestions] [Customize] [Ignore]
```

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Activity Bar]]
- [[Wiki Links]]
- [[Daily Notes]]
- [[Knowledge Graph View]]
- [[Obsidian-Like Experience]]
- [[Knowledge Base Maintenance]]
- [[Knowledge Graph Health Metrics]]
- [[AI Deletion Agents]]
