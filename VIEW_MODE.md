# View Mode Feature

## Overview

Quallaa now supports two distinct view modes to serve different user workflows:

1. **Knowledge Base View (KB View)** - Knowledge-first interface for writers,
   researchers, and note-takers
2. **Developer View** - Full IDE experience with all development tools

## What is KB View?

KB View is a simplified, distraction-free interface designed for users who
primarily work with notes, documents, and knowledge management. It hides
developer-focused panels and prominently features knowledge management tools.

### KB View Shows:

- ✅ File Explorer
- ✅ Backlinks Panel
- ✅ Knowledge Graph
- ✅ Tags Browser
- ✅ Daily Notes features
- ✅ Note Templates
- ✅ Outline View
- ✅ Search

### KB View Hides:

- ❌ Terminal
- ❌ Debug Panel
- ❌ Source Control (Git)
- ❌ Problems Panel
- ❌ Output Panel
- ❌ Timeline View
- ❌ Test Explorer
- ❌ Bottom Panel (collapsed)

## What is Developer View?

Developer View is the full IDE experience with all development tools visible.
This mode is ideal for:

- Software developers
- Technical writers who also code
- Users who need both knowledge management and coding tools

### Developer View Shows:

- ✅ All Knowledge Base features (from KB View)
- ✅ Terminal
- ✅ Debug Panel
- ✅ Source Control (Git)
- ✅ Problems Panel
- ✅ Output Panel
- ✅ Timeline View
- ✅ Test Explorer
- ✅ Bottom Panel

## How to Switch Modes

### Method 1: Status Bar Indicator

Click the view mode indicator in the bottom-left status bar:

- `📖 KB View` - Currently in Knowledge Base View (click to toggle)
- `</> Developer View` - Currently in Developer View (click to toggle)

### Method 2: Command Palette (F1)

Open the command palette (F1) and type:

- **"Switch to Knowledge Base View"** - Switch to KB mode
- **"Switch to Developer View"** - Switch to Developer mode
- **"Toggle View Mode"** - Toggle between modes

### Method 3: View Menu

Use the **View** menu:

- View → Switch to KB View
- View → Switch to Developer View
- View → Toggle View Mode

## Persistence

Your selected view mode is saved automatically and will be restored when you
reopen Quallaa.

## For Which Users?

### Recommended for KB View:

- 📝 Writers and researchers
- 📚 Students and academics
- 🗂️ Personal knowledge base users
- 📖 Documentation writers
- 💭 Brainstorming and ideation
- 📊 Note-takers using Zettelkasten, PARA, or other PKM methods

### Recommended for Developer View:

- 💻 Software developers
- 🔧 Technical writers who code
- 🧪 Users who need debugging and testing tools
- 🌳 Git/version control users
- 🔨 Users who need terminal access

## Philosophy

Quallaa's dual view modes reflect our core philosophy:

> **Traditional IDEs assume you're writing code.** **Quallaa assumes you're
> building a knowledge base that happens to be executable.**

KB View puts knowledge management first, while Developer View provides the full
power of an IDE when you need it. You're always just one click away from
switching modes.

## Implementation Details

### Technical Architecture

**ViewModeManager Service**
`theia-extensions/product/src/browser/view-mode-manager.ts`

Manages the current mode and applies layout configurations:

- Stores mode preference in browser storage
- Emits events when mode changes
- Controls widget visibility based on mode

**ViewModeContribution**
`theia-extensions/product/src/browser/view-mode-contribution.ts`

Registers commands, menus, and status bar indicator:

- 3 commands: switch to KB, switch to Developer, toggle
- View menu entries
- Status bar indicator with click-to-toggle

**Storage** Mode preference is stored in: `'quallaa.view.mode'` (browser local
storage)

### Default Mode

By default, Quallaa starts in **Knowledge Base View** on first launch,
reflecting the product's knowledge-first philosophy.

## Future Enhancements

Potential improvements for future versions:

1. **Customizable View Modes**
    - Allow users to create custom view mode configurations
    - Save/load layout presets

2. **Smart Mode Switching**
    - Auto-suggest mode based on file type (e.g., switch to Developer View when
      opening .py files)
    - Context-aware mode recommendations

3. **View Mode Shortcuts**
    - Keyboard shortcuts for quick mode switching
    - Gesture support (swipe between modes)

4. **Per-Workspace Modes**
    - Remember different modes for different workspaces
    - Auto-switch based on workspace type

5. **Hybrid Modes**
    - "Writer + Terminal" mode
    - "Research + Git" mode
    - Allow fine-grained control over which panels are visible

## Accessibility

The view mode system is fully accessible:

- Status bar indicator has descriptive tooltip
- All commands available via keyboard (F1 → command palette)
- Screen reader support for mode changes
- Visual indicators for current mode

## Performance

Mode switching is lightweight and instantaneous:

- No application restart required
- Instant panel visibility changes
- Minimal performance impact
- Smooth transitions between modes

---

**Version:** 1.66.100 **Feature Added:** 2025-11-09 **Status:** ✅ Production
Ready
