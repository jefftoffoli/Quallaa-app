# Daily Notes

## What They Are

**Daily Notes** = Automatically created note for each day, timestamped and ready for journaling

Also called "Journal" or "Today's Note"

## Physical Metaphor

**Daily Journal**

```
Like a paper journal where each page is dated:

January 15, 2025
─────────────────
Morning thoughts...
Meeting notes...
Quick captures...

January 16, 2025
─────────────────
New day, fresh page!
```

## Why They're Useful

### Low-Friction Capture

```
Idea pops into head
→ Hit keyboard shortcut
→ Daily note opens
→ Start typing
→ Done!

No "where should this go?" paralysis
```

### Temporal Organization

```
"What did I work on last Tuesday?"
→ Open 2025-01-09.md
→ All notes from that day
```

### Linking Hub

```
Daily notes link to project notes:

2025-01-15.md:
- Worked on [[Project A]]
- Meeting about [[Redesign]]
- Read [[Article XYZ]]

Daily note becomes timeline!
```

## File Naming

### YYYY-MM-DD Format (ISO 8601)

```
2025-01-15.md   ← Jan 15, 2025
2025-01-16.md
2025-01-17.md
```

**Benefits:**
- Sorts chronologically
- Unambiguous
- International standard

### Alternative Formats

```
2025-W03.md          ← Weekly note
2025-01.md           ← Monthly note
2025-Q1.md           ← Quarterly note
```

## Implementation

### Auto-Create on Command

```typescript
@injectable()
export class DailyNotesService {

  @inject(FileService)
  protected readonly fileService: FileService

  @inject(WorkspaceService)
  protected readonly workspace: WorkspaceService

  @inject(EditorManager)
  protected readonly editorManager: EditorManager

  async openTodaysNote(): Promise<void> {
    const notePath = await this.getTodaysNotePath()

    // Create if doesn't exist
    if (!await this.fileService.exists(notePath)) {
      await this.createDailyNote(notePath)
    }

    // Open in editor
    await this.editorManager.open(notePath)
  }

  protected async getTodaysNotePath(): Promise<URI> {
    const workspace = await this.workspace.workspace
    if (!workspace) {
      throw new Error('No workspace open')
    }

    const dailyNotesFolder = this.getDailyNotesFolder(workspace.uri)
    const today = this.formatDate(new Date())
    const fileName = `${today}.md`

    return dailyNotesFolder.resolve(fileName)
  }

  protected formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  protected async createDailyNote(path: URI): Promise<void> {
    const date = new Date()
    const template = this.getDailyNoteTemplate(date)

    await this.fileService.create(path, template)
  }

  protected getDailyNoteTemplate(date: Date): string {
    const title = this.formatDateLong(date)  // "January 15, 2025"

    return `# ${title}

## Notes



## Tasks

- [ ]


## Links

-


---
Created: ${date.toISOString()}
Tags: #daily-note
`
  }

  protected formatDateLong(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  protected getDailyNotesFolder(workspaceUri: URI): URI {
    // Check user preference
    const customFolder = this.preferences.get('dailyNotes.folder')

    if (customFolder) {
      return workspaceUri.resolve(customFolder)
    }

    // Default: Daily Notes/ folder
    return workspaceUri.resolve('Daily Notes')
  }
}
```

### Keyboard Shortcut

```typescript
@injectable()
export class DailyNotesKeybinding implements KeybindingContribution {

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: 'daily-notes.open-today',
      keybinding: 'ctrlcmd+shift+d'  // Cmd+Shift+D
    })
  }
}
```

### Command Registration

```typescript
@injectable()
export class DailyNotesCommands implements CommandContribution {

  @inject(DailyNotesService)
  protected readonly dailyNotes: DailyNotesService

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand({
      id: 'daily-notes.open-today',
      label: 'Daily Notes: Open Today'
    }, {
      execute: () => this.dailyNotes.openTodaysNote()
    })

    commands.registerCommand({
      id: 'daily-notes.open-yesterday',
      label: 'Daily Notes: Open Yesterday'
    }, {
      execute: () => this.dailyNotes.openYesterday()
    })

    commands.registerCommand({
      id: 'daily-notes.open-tomorrow',
      label: 'Daily Notes: Open Tomorrow'
    }, {
      execute: () => this.dailyNotes.openTomorrow()
    })
  }
}
```

## Calendar Integration

### Calendar View Widget

```
┌─────────────────────────┐
│  January 2025           │
├─────────────────────────┤
│ Su Mo Tu We Th Fr Sa    │
│           1  2  3  4    │
│  5  6  7  8  9 10 11    │
│ 12 13 14 ●15 16 17 18   │ ← Today (filled)
│ 19 20 21 22 23 24 25    │
│ 26 27 28 29 30 31       │
└─────────────────────────┘

● = Has daily note
○ = No note yet
```

Click date → Open/create that daily note

### Implementation

```typescript
export class CalendarWidget extends ReactWidget {

  protected render(): React.ReactNode {
    const days = this.getDaysInMonth()

    return <div className='calendar'>
      <div className='calendar-header'>
        <button onClick={this.previousMonth}>←</button>
        <span>{this.currentMonth}</span>
        <button onClick={this.nextMonth}>→</button>
      </div>

      <div className='calendar-grid'>
        {days.map(day =>
          <div
            key={day.date}
            className={this.getDayClasses(day)}
            onClick={() => this.openDayNote(day)}
          >
            {day.number}
          </div>
        )}
      </div>
    </div>
  }

  protected getDayClasses(day: CalendarDay): string {
    const classes = ['calendar-day']

    if (day.isToday) classes.push('today')
    if (day.hasNote) classes.push('has-note')
    if (day.isWeekend) classes.push('weekend')

    return classes.join(' ')
  }
}
```

## Templates

### User-Defined Templates

```typescript
// User creates: templates/daily-note.md

# {{date:MMMM DD, YYYY}}

## 🌅 Morning

What's my focus today?


## 📝 Notes



## 🎯 Wins

What went well?


---
[[{{date:YYYY-MM-DD|offset:-1}}|← Yesterday]] | [[{{date:YYYY-MM-DD|offset:1}}|Tomorrow →]]
```

### Template Variables

```typescript
function processTemplate(template: string, date: Date): string {
  return template
    .replace(/\{\{date:([^}]+)\}\}/g, (match, format) => {
      return formatDate(date, format)
    })
    .replace(/\{\{date:([^|]+)\|offset:(-?\d+)\}\}/g, (match, format, offset) => {
      const offsetDate = new Date(date)
      offsetDate.setDate(date.getDate() + parseInt(offset))
      return formatDate(offsetDate, format)
    })
}
```

## Navigation Between Days

### Previous/Next Commands

```typescript
// Keyboard shortcuts
Cmd+Shift+[ = Open yesterday
Cmd+Shift+] = Open tomorrow
```

### Links in Note

```markdown
← [[2025-01-14]] | [[2025-01-16]] →
```

Auto-generated links to adjacent days

## Activity Bar Integration

Add daily note icon to [[Activity Bar]]:

```typescript
┌─┐
│📅│ ← Daily Notes (always visible)
└─┘
```

Click → Opens calendar view + today's note

## Obsidian Comparison

**Obsidian Daily Notes:**
- Core plugin (built-in)
- Cmd+D shortcut
- Template support
- Calendar plugin available

**Our Implementation:**
- Same features
- Integrated into [[Activity Bar]]
- Part of knowledge-first experience

## Progressive Disclosure

**Beginner:** Always visible (encourages note-taking)
**Intermediate:** Same
**Advanced:** Same

Daily notes are fundamental, always shown.

## Related Concepts

- [[Project Vision - Knowledge-First IDE]]
- [[Activity Bar]]
- [[Wiki Links]]
- [[Tags System]]
- [[Quick Switcher]]
- [[Obsidian-Like Experience]]
