# Progressive Disclosure Pattern

## What It Is

**Progressive Disclosure** = Start simple, reveal complexity only when needed

For our project: Start as a knowledge base, progressively reveal IDE features as the user demonstrates they need them.

## Physical Metaphor

**Library with Hidden Workshop**

```
Beginner View:
┌─────────────────────┐
│  📚 Library         │  ← Friendly, simple
│  Just notes         │
│  No scary tools     │
└─────────────────────┘

Advanced User:
┌──────┬──────────────┐
│ 📁   │ 📚 + Code    │  ← Workshop revealed
│ ⎇    │ Tools appear │
│ 🐛   │ as needed    │
├──────┴──────────────┤
│ $ terminal          │
└─────────────────────┘
```

## User Journey

### Day 1: Pure Note-Taking
```
┌─────────────────────────┐
│ 📝 Just markdown editor │
│ No file tree            │
│ No terminal             │
│ No git panel            │
└─────────────────────────┘
```

### Week 1: First Code Mention
```
User types: ```python
System thinks: "They mentioned code... maybe add syntax highlighting?"

┌─────────────────────────┐
│ 📝 Markdown with        │
│ syntax highlighting     │
│                         │
│ ```python               │
│ print("hello")          │
│ ```                     │
└─────────────────────────┘
```

### Week 2: Asking About Files
```
User searches: "where is config.json"
System thinks: "They need file navigation"

Activity Bar reveals:
├─ 📚 Notes (still first)
└─ 📁 Files ← NEW! Appears based on need
```

### Month 1: Power User
```
User has shown they need:
├─ File explorer (revealed)
├─ Terminal (revealed)
├─ Git panel (revealed)
└─ Debug panel (revealed)

Now looks like full IDE!
```

## Implementation Concept

```typescript
export class ProgressiveDisclosureService {
  private techLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'

  trackAction(action: UserAction): void {
    // Detect signals of increasing sophistication
    if (action.type === 'mention-code-language') {
      this.signals.push('code-aware')
    }
    if (action.type === 'search-for-file-by-path') {
      this.signals.push('file-system-aware')
    }
    if (action.type === 'use-git-command') {
      this.signals.push('version-control-aware')
    }

    this.updateTechLevel()
    this.updateUI()
  }

  shouldShowFeature(feature: string): boolean {
    switch (feature) {
      case 'file-explorer':
        return this.techLevel !== 'beginner'
      case 'terminal':
        return this.techLevel === 'advanced'
      case 'git-panel':
        return this.techLevel === 'advanced'
      default:
        return true  // KB features always visible
    }
  }
}
```

## Signals for Disclosure

### Beginner → Intermediate
- Creates more than 10 notes
- Uses wiki links frequently
- Mentions file paths in notes
- Uses tags extensively

### Intermediate → Advanced
- Types code blocks in multiple languages
- Searches for files by extension
- Mentions git/version control
- Uses keyboard shortcuts

## Features by Level

### Always Visible (Knowledge-First)
- ✅ Note editor (WYSIWYG)
- ✅ [[Quick Switcher]]
- ✅ [[Knowledge Graph View]]
- ✅ [[Backlinks Panel]]
- ✅ [[Daily Notes]]
- ✅ [[Tags System]]

### Progressive (Code-Aware)
- 🔓 File Explorer
- 🔓 Search across files
- 🔓 Extensions panel
- 🔓 Source control (Git)
- 🔓 Terminal
- 🔓 Debug panel

## Benefits

### 1. Less Overwhelming
New users see simple, focused interface

### 2. Natural Growth
Power users get tools when they need them

### 3. Discovery
Users learn features exist as they need them

### 4. Reversible
Can always manually hide/show panels

## Questions to Answer

See: [[Open Questions]]

- Should we ask user their level upfront?
- Or purely automatic detection?
- Can users manually "unlock" features early?
- How do we tutorial new revealed features?

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Natural Language Developers]]
- [[Obsidian-Like Experience]]
- [[How to Customize Application Shell]]
