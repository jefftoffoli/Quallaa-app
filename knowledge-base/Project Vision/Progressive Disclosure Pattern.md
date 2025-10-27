# Progressive Disclosure Pattern

**Status:** ❌ NOT IMPLEMENTING (automatic detection removed from roadmap)

## What It Was

**Original idea:** Start simple, reveal complexity only when needed. Automatically detect user sophistication and progressively reveal IDE features.

**Decision:** This adds too much complexity. Instead, we'll use sensible defaults with manual control.

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

## Alternative Approach (Simplified)

Instead of automatic detection, we'll use:

### Simple Preferences

```typescript
interface UIPreferences {
  // Simple toggle, not automatic detection
  showAdvancedIDEFeatures: boolean  // default: false
}
```

### Default Panel Layout

**Standard view (default):**
- ✅ Notes Library
- ✅ Tags Browser
- ✅ Knowledge Graph
- ✅ Backlinks
- ✅ AI Chat
- ❌ File Explorer (hidden)
- ❌ Git Panel (hidden)
- ❌ Debug Panel (hidden)

**Advanced view (user-enabled):**
- ✅ All standard panels
- ✅ File Explorer
- ✅ Git Panel
- ✅ Terminal
- ✅ Debug Panel

Users can toggle via: Preferences → "Show advanced IDE features"

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

## Why We Removed Automatic Detection

See: [[Open Questions]]

**Reasons:**
1. **Complexity:** Tracking user actions and inferring intent is error-prone
2. **Predictability:** Users prefer knowing where features are
3. **Control:** Manual toggle is simpler and more transparent
4. **Edge cases:** Hard to handle users who are sophisticated in some areas but not others

**Better approach:** Good defaults + easy discoverability + user control

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Natural Language Developers]]
- [[Obsidian-Like Experience]]
- [[How to Customize Application Shell]]
