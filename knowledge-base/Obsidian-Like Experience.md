# Obsidian-Like Experience

## What It Is

**Obsidian-Like Experience** = The design goal for our knowledge-first IDE

Obsidian's simplicity + IDE's power, progressively revealed.

## Why Obsidian?

**Obsidian** is the gold standard for knowledge management:

```
✅ Simple, focused UI
✅ File-based (not database)
✅ Wiki links built-in
✅ Graph visualization
✅ Markdown-native
✅ Extensible
✅ Fast
✅ Offline-first
```

But Obsidian is NOT an IDE:

```
❌ Can't execute code
❌ No git integration
❌ No debugging
❌ No terminal
❌ Limited file management
```

## Our Goal

```
Start with Obsidian's experience
    ↓
Add IDE features progressively
    ↓
End with full development environment
    ↓
But knowledge-first, NOT code-first
```

## Visual Comparison

### Obsidian Layout

```
┌─┬────────────────┬─┐
│📁│                │📋│
│🔍│   Main         │  │
│📊│   Editor       │  │
│⭐│                │  │
└─┴────────────────┴─┘
 ↑                  ↑
Ribbon         Right sidebar
(like Activity Bar)
```

### Our Layout (Beginner Mode)

```
┌─┬────────────────┬─┐
│📚│                │🔗│
│🏷️│   WYSIWYG      │  │
│📊│   Markdown     │  │
│📅│                │  │
└─┴────────────────┴─┘
 ↑                  ↑
Knowledge-first   Context panels
```

### Our Layout (Advanced Mode)

```
┌─┬────────────────┬─┐
│📚│                │🔗│
│🏷️│   Editor       │  │
│📊│   (Monaco)     │  │
│📅│                │  │
├─┤                │  │
│📁│                │  │
│⎇ │                │  │
│🐛│                │  │
└─┴────────────────┴─┘
 ↑
IDE features revealed
```

## Key Features to Match

### 1. Wiki Links

See: [[Wiki Links]]

```markdown
[[Note Title]]
[[Note|Alias]]
[[Note#Section]]
```

**Status:** Must implement

### 2. Backlinks

See: [[Backlinks Panel]]

Show all notes linking to current note.

**Status:** Must implement

### 3. Graph View

See: [[Knowledge Graph View]]

Interactive visualization of note connections.

**Status:** Must implement

### 4. Quick Switcher

See: [[Quick Switcher]]

Cmd+O to jump anywhere.

**Status:** Must implement

### 5. Daily Notes

See: [[Daily Notes]]

Automatic journal entries.

**Status:** Must implement

### 6. Tags

See: [[Tags System]]

`#tag` syntax for organization.

**Status:** Must implement

### 7. WYSIWYG Editing

See: [[WYSIWYG Markdown Editor]]

Rendered markdown while typing.

**Status:** Must implement (differentiator!)

### 8. File-Based Storage

```
vault/
├─ Note 1.md
├─ Note 2.md
└─ assets/
   └─ image.png
```

**Status:** Already supported (Theia)

### 9. Themes

Dark/light themes, customizable.

**Status:** Already supported (Theia)

### 10. Command Palette

Cmd+Shift+P for all commands.

**Status:** Already supported (Theia)

## What We Do BETTER Than Obsidian

### 1. Code Execution

```markdown
# My Note

Here's my idea:

```python
def calculate():
    return 42
```

[Run] → Execute in terminal or output panel
```

**Obsidian:** Can't run code
**Us:** Can execute (when user needs it)

### 2. Git Integration

**Obsidian:** Needs plugin, basic functionality
**Us:** Full Theia git support (when revealed)

### 3. Debugging

**Obsidian:** Not possible
**Us:** Full debug panel (for advanced users)

### 4. Terminal

**Obsidian:** Not available
**Us:** Integrated terminal (when revealed)

### 5. Extensions

**Obsidian:** Custom plugin API
**Us:** Full VS Code extension compatibility

### 6. Progressive Disclosure

See: [[Progressive Disclosure Pattern]]

**Obsidian:** Same UI for everyone
**Us:** Adapts to user sophistication

## What We Keep from Theia

### 1. Widget System

See: [[Widget System]]

Flexible, composable UI components.

### 2. Dependency Injection

See: [[Dependency Injection in Theia]]

Clean architecture, testable code.

### 3. Extension System

Add features via extensions.

### 4. Monaco Editor

Powerful editor with IntelliSense (for code files).

### 5. Monorepo Structure

Modular, maintainable codebase.

## Implementation Checklist

### Phase 1: Core Knowledge Features
- [ ] [[Wiki Links]] with autocomplete
- [ ] [[Backlinks Panel]]
- [ ] [[Quick Switcher]]
- [ ] [[Tags System]]
- [ ] Basic [[Knowledge Graph View]]

### Phase 2: WYSIWYG Experience
- [ ] [[WYSIWYG Markdown Editor]]
- [ ] Hide file tree by default
- [ ] Knowledge-first [[Activity Bar]]
- [ ] [[Daily Notes]]

### Phase 3: Progressive Disclosure
- [ ] User level detection
- [ ] Conditional UI rendering
- [ ] Feature revelation logic
- [ ] Tutorial system

### Phase 4: IDE Features (Hidden Initially)
- [ ] File explorer (revealed later)
- [ ] Git panel (revealed later)
- [ ] Terminal (revealed later)
- [ ] Debug panel (revealed later)

## User Experience Goals

### For Beginners

```
Day 1:
"This looks like Obsidian!"
↓
"I can write notes easily"
↓
"Oh, links are cool!"
↓
"Graph view is beautiful!"
```

### For Intermediate Users

```
Week 2:
"I need to find a specific file..."
↓
File explorer appears!
↓
"Oh, there's a file browser now"
↓
"This is growing with me"
```

### For Advanced Users

```
Month 1:
"I need version control..."
↓
Git panel appears!
↓
"This is a full IDE now!"
↓
"But still feels like Obsidian for notes"
```

## Differentiation Matrix

| Feature | Obsidian | Foam | Us |
|---------|----------|------|-----|
| **Wiki Links** | ✅ | ✅ | ✅ |
| **Graph View** | ✅ | ✅ | ✅ |
| **Backlinks** | ✅ | ✅ | ✅ |
| **WYSIWYG** | ✅ | ❌ | ✅ |
| **Code Exec** | ❌ | ❌ | ✅ |
| **Git** | Plugin | ✅ | ✅ |
| **Terminal** | ❌ | ✅ | ✅ |
| **Progressive** | ❌ | ❌ | ✅ |
| **UI Focus** | KB | Code | **KB→Code** |

## Design Philosophy

```
Obsidian: "A second brain"
VS Code: "Code editing. Redefined"
Foam: "VS Code + knowledge management"

Us: "Knowledge-first development environment"
```

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Progressive Disclosure Pattern]]
- [[Natural Language Developers]]
- [[Foam Project Analysis]]
- [[Wiki Links]]
- [[WYSIWYG Markdown Editor]]
- All feature documents (Backlinks, Graph, etc.)
