# Product Branding and UI Text

**Status:** ⚠️ TODO - Needs custom Quallaa messaging

## Context

As of commit `1ae4718` (2025-10-25), we've updated all package.json metadata and configuration to use "Quallaa" branding. However, the **user-facing UI text** still references "Eclipse Theia IDE".

## Files That Need Updating

### Primary Branding File
**`theia-extensions/product/src/browser/branding-util.tsx`**

This file contains the "Getting Started" widget content that appears when users first open Quallaa. Currently it has:

#### What Needs Changing:

1. **renderWhatIs()** - Lines 30-46
   - Currently: "The Eclipse Theia IDE is a modern and open IDE..."
   - Links to: theia-ide.org, try.theia-cloud.io
   - **Needs:** Custom Quallaa description, our own links

2. **renderExtendingCustomizing()** - Lines 48-64
   - Currently: "Extending/Customizing the Theia IDE"
   - References Theia platform docs
   - **Needs:** How to extend Quallaa (when we have docs)

3. **renderSupport()** - Lines 66-77
   - Currently: Links to theia-ide.org/support
   - **Needs:** Link to our support (Discord? GitHub Discussions?)

4. **renderTickets()** - Lines 79-98
   - Currently: Links to eclipse-theia repos
   - **Needs:** Link to github.com/jefftoffoli/Quallaa-app/issues

5. **renderSourceCode()** - Lines 100-111
   - Currently: Links to eclipse-theia/theia-ide
   - **Needs:** Link to jefftoffoli/Quallaa-app

6. **renderDocumentation()** - Lines 113-123
   - Currently: Links to theia-ide.org/docs
   - **Needs:** Our documentation (when we have it)

7. **renderDownloads()** - Lines 140-154
   - Currently: "You can update Eclipse Theia IDE..."
   - **Needs:** "You can update Quallaa..."

8. **renderCollaboration()** - Lines 125-138
   - Currently: Collaboration feature description
   - **Needs:** Decision - do we keep this feature?

### Other Files to Check

Search results showed these files also have Theia IDE references:
- `theia-extensions/product/src/browser/theia-ide-about-dialog.tsx`
- `theia-extensions/product/src/browser/theia-ide-contribution.tsx`
- `theia-extensions/product/src/browser/theia-ide-getting-started-widget.tsx`
- `theia-extensions/product/src/browser/theia-ide-frontend-module.ts`
- `theia-extensions/product/src/electron-main/icon-contribution.ts`
- `theia-extensions/product/src/electron-main/theia-ide-main-module.ts`

## Proposed Quallaa Messaging

### "What is Quallaa?"

```
Quallaa is a knowledge-first IDE that puts markdown and knowledge
management at the center of your development workflow.

Think in natural language. Organize with wiki-style linking.
Execute when you need to.

Built on the Eclipse Theia platform, Quallaa combines the knowledge
graph experience of Obsidian with the full power of a modern IDE.
```

### "Getting Help"
- GitHub Issues: https://github.com/jefftoffoli/Quallaa-app/issues
- Discord: [TBD - do we want a Discord?]
- Documentation: [TBD - where will docs live?]

### "Extending Quallaa"
- VS Code extensions work (OpenVSX registry)
- Source code available under EPL-2.0
- Fork and customize for your needs

## Decisions Needed

Before updating the branding file, we need to decide:

1. **Support Channel**
   - GitHub Issues only?
   - Discord server?
   - GitHub Discussions?
   - Email?

2. **Documentation**
   - Where will docs live?
   - README-based?
   - Separate docs site?
   - Wiki?

3. **Collaboration Feature**
   - Keep it? (Uses third-party Open Collab Tools)
   - Remove it?
   - Make it a premium feature?

4. **Downloads/Updates**
   - GitHub Releases for distribution
   - Auto-update via electron-updater
   - Update channel strategy (see [[Publishing and Release Process]])

## Action Items

- [ ] Decide on support/help channels
- [ ] Decide on documentation location
- [ ] Write custom Quallaa "What is this?" description
- [ ] Update all branding-util.tsx functions
- [ ] Update About dialog
- [ ] Update Getting Started widget
- [ ] Search for remaining "Theia IDE" references in UI
- [ ] Update copyright headers to EPL-2.0

## Related Documents

- [[Publishing and Release Process]] - Release strategy
- [[Project Vision - Knowledge-First IDE]] - Core messaging
- [[Open Questions]] - Other decisions

## Technical Notes

**File path:** `theia-extensions/product/src/browser/branding-util.tsx`

**License header** (lines 1-8) currently says:
```
Copyright (C) 2020 EclipseSource and others.
terms of the MIT License
SPDX-License-Identifier: MIT
```

This should be updated to:
```
Copyright (C) 2025 Jeff Toffoli
Copyright (C) 2020 EclipseSource and others.
terms of the Eclipse Public License 2.0
SPDX-License-Identifier: EPL-2.0
```
