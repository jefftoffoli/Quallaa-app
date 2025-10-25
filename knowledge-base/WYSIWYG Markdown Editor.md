# WYSIWYG Markdown Editor

## What It Is

**WYSIWYG** = "What You See Is What You Get"

A markdown editor that shows **formatted output** while you type, not raw markdown syntax.

## Physical Metaphor

**Word Processor vs Typewriter**

```
Traditional Markdown (Typewriter):
┌──────────────────────┐
│ # Heading            │ ← You see syntax
│                      │
│ **bold** text        │ ← You see **
│                      │
│ - List item          │ ← You see -
└──────────────────────┘

WYSIWYG Markdown (Word Processor):
┌──────────────────────┐
│ Heading              │ ← Looks like heading
│                      │
│ bold text            │ ← Actually bold
│                      │
│ • List item          │ ← Rendered bullet
└──────────────────────┘
```

## Why It Matters for Our Project

See: [[Project Vision - Knowledge-First IDE]]

**Target audience:** [[Natural Language Developers]]

```
They want to THINK in writing,
not THINK about markdown syntax.
```

## Visual Comparison

### Traditional (Monaco/VS Code)

```
## Project Ideas

We should build a **knowledge-first IDE** that focuses on:

- [[Wiki Links]]
- #tags
- Graph visualization

See: [Architecture](./arch.md)
```

User sees ALL the syntax markers.

### WYSIWYG (Our Goal)

```
Project Ideas                    ← h2, styled larger
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We should build a knowledge-first IDE that focuses on:

• Wiki Links                     ← Clickable link
• tags                           ← Styled tag
• Graph visualization            ← Bullet rendered

See: Architecture                ← Clickable link, no ./ visible
```

User sees formatted output.

## Implementation Options

### Option 1: Replace Monaco with TipTap

**TipTap** = Modern WYSIWYG editor for React

```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

export class MarkdownEditorWidget extends ReactWidget {

  protected render(): React.ReactNode {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Link,
        WikiLinkExtension,  // Custom
        TagExtension,       // Custom
      ],
      content: this.getMarkdownContent(),
      onUpdate: ({ editor }) => {
        this.saveMarkdown(editor.storage.markdown.getMarkdown())
      }
    })

    return <EditorContent editor={editor} />
  }
}
```

**Pros:**
- ✅ True WYSIWYG
- ✅ Easy to extend
- ✅ Good performance

**Cons:**
- ❌ Replaces Monaco (lose IDE features)
- ❌ Different API to learn
- ❌ Markdown conversion complexity

### Option 2: Monaco with Heavy Customization

Use Monaco but hide/render syntax:

```typescript
// Hide markdown syntax with decorations
editor.deltaDecorations([], [
  {
    range: new Range(1, 1, 1, 3),  // "# " at line 1
    options: {
      inlineClassName: 'hidden',    // Hide the #
      before: {
        content: '📌',               // Show icon instead
        inlineClassName: 'heading-marker'
      }
    }
  }
])
```

**Pros:**
- ✅ Keep Monaco features
- ✅ Code highlighting still works
- ✅ Familiar Theia integration

**Cons:**
- ❌ Not true WYSIWYG
- ❌ Extremely complex
- ❌ Performance issues

### Option 3: Hybrid - Two Editors

Like [[Diff Editor Architecture]], use composite widget:

```
┌─────────────────────────────────┐
│ WYSIWYG View (default)          │ ← TipTap editor
├─────────────────────────────────┤
│ Source View (toggle)            │ ← Monaco editor (hidden)
└─────────────────────────────────┘
```

Toggle between views, sync content.

**Pros:**
- ✅ Best of both worlds
- ✅ Power users can use source
- ✅ Beginners get WYSIWYG

**Cons:**
- ❌ More complex
- ❌ Sync issues possible

### Option 4: Use Existing WYSIWYG Editor

**Milkdown**, **ProseMirror**, **CodeMirror 6**

Similar trade-offs to TipTap.

## Recommended Approach

**Start with Option 3 (Hybrid)**

```typescript
@injectable()
export class MarkdownEditorWidget extends BaseWidget {

  protected wysiwygEditor: TipTapWidget
  protected sourceEditor: MonacoEditor
  protected currentMode: 'wysiwyg' | 'source' = 'wysiwyg'

  @postConstruct()
  protected init(): void {
    // Create both editors
    this.wysiwygEditor = this.createWYSIWYGEditor()
    this.sourceEditor = this.createSourceEditor()

    // Show WYSIWYG by default
    this.showEditor('wysiwyg')
  }

  protected showEditor(mode: 'wysiwyg' | 'source'): void {
    if (mode === 'wysiwyg') {
      this.sourceEditor.hide()
      this.wysiwygEditor.show()

      // Sync content FROM source TO wysiwyg
      const markdown = this.sourceEditor.getValue()
      this.wysiwygEditor.setContent(markdown)
    } else {
      this.wysiwygEditor.hide()
      this.sourceEditor.show()

      // Sync content FROM wysiwyg TO source
      const markdown = this.wysiwygEditor.getMarkdown()
      this.sourceEditor.setValue(markdown)
    }

    this.currentMode = mode
  }

  toggleMode(): void {
    const newMode = this.currentMode === 'wysiwyg' ? 'source' : 'wysiwyg'
    this.showEditor(newMode)
  }
}
```

### Toggle Button in Toolbar

```typescript
// Add button to editor toolbar
<button onClick={() => this.editor.toggleMode()}>
  {mode === 'wysiwyg' ? '📝 Source' : '👁️ WYSIWYG'}
</button>
```

## Custom Extensions Needed

### Wiki Links Extension

```typescript
import { Node } from '@tiptap/core'

export const WikiLinkExtension = Node.create({
  name: 'wikiLink',

  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      target: {
        default: null,
      },
      alias: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{
      tag: 'a[data-wiki-link]',
    }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['a', {
      ...HTMLAttributes,
      'data-wiki-link': '',
      'href': `#${node.attrs.target}`,
      'class': 'wiki-link',
    }, node.attrs.alias || node.attrs.target]
  },

  addCommands() {
    return {
      setWikiLink: (target: string, alias?: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { target, alias },
        })
      },
    }
  },

  // Parse [[Note Title]] or [[Note|Alias]]
  addInputRules() {
    return [{
      find: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/,
      handler: ({ state, range, match }) => {
        const target = match[1]
        const alias = match[2]

        const node = state.schema.nodes.wikiLink.create({
          target,
          alias,
        })

        const tr = state.tr.replaceWith(range.from, range.to, node)
        state.apply(tr)
      },
    }]
  },
})
```

### Tag Extension

```typescript
export const TagExtension = Node.create({
  name: 'tag',

  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      tag: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{
      tag: 'span[data-tag]',
    }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      'data-tag': '',
      'class': 'tag',
    }, `#${node.attrs.tag}`]
  },

  // Parse #tag
  addInputRules() {
    return [{
      find: /#([a-zA-Z0-9_/-]+)/,
      handler: ({ state, range, match }) => {
        const tag = match[1]

        const node = state.schema.nodes.tag.create({ tag })

        const tr = state.tr.replaceWith(range.from, range.to, node)
        state.apply(tr)
      },
    }]
  },
})
```

## Styling

```css
/* Make WYSIWYG look like rendered markdown */
.tiptap {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  padding: 20px;
}

.tiptap h1 {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #ddd;
}

.tiptap h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.4em;
}

.tiptap .wiki-link {
  color: var(--theia-editorLink-activeForeground);
  text-decoration: none;
  cursor: pointer;
}

.tiptap .wiki-link:hover {
  text-decoration: underline;
}

.tiptap .wiki-link.broken {
  color: var(--theia-errorForeground);
  opacity: 0.7;
}

.tiptap .tag {
  background-color: var(--theia-badge-background);
  color: var(--theia-badge-foreground);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  cursor: pointer;
}
```

## Integration with OpenHandler

See: [[OpenHandler Priority System]]

```typescript
@injectable()
export class MarkdownEditorOpenHandler implements OpenHandler {

  readonly id = 'markdown-wysiwyg-editor'

  canHandle(uri: URI): number {
    // High priority for .md files
    return uri.path.ext === '.md' ? 1000 : 0
  }

  async open(uri: URI): Promise<MarkdownEditorWidget> {
    const widget = await this.widgetManager.getOrCreateWidget(
      MARKDOWN_EDITOR_WIDGET_ID,
      { uri }
    )

    this.shell.addWidget(widget, { area: 'main' })
    this.shell.activateWidget(widget.id)

    return widget
  }
}
```

## Progressive Disclosure

See: [[Progressive Disclosure Pattern]]

**Beginner:** WYSIWYG only (don't show source toggle)
**Intermediate:** Show source toggle in preferences
**Advanced:** Source toggle in toolbar

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Natural Language Developers]]
- [[OpenHandler Priority System]]
- [[Widget System]]
- [[Wiki Links]]
- [[Obsidian-Like Experience]]
- [[Open Questions]] (WYSIWYG vs Source toggle)
