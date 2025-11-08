/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
 ********************************************************************************/

/**
 * Template variable replacement system
 * Extends Foam's template pattern with additional variables
 */

export interface TemplateContext {
    /** Note title */
    title?: string;
    /** Current date */
    date?: Date;
    /** Author name (from git config or settings) */
    author?: string;
    /** Tags to add to the note */
    tags?: string[];
    /** Workspace name */
    workspace?: string;
}

/**
 * Get all available template variables
 * Following Foam's ${VARIABLE} pattern
 */
export function getAvailableVariables(): string[] {
    return [
        'FOAM_TITLE',
        'FOAM_DATE_YEAR',
        'FOAM_DATE_MONTH',
        'FOAM_DATE_DATE',
        'FOAM_DATE_YEAR_SHORT',
        'FOAM_DATE_MONTH_NAME',
        'FOAM_DATE_MONTH_NAME_SHORT',
        'FOAM_DATE_DAY_NAME',
        'FOAM_DATE_DAY_NAME_SHORT',
        'FOAM_DATE_HOUR',
        'FOAM_DATE_MINUTE',
        'FOAM_AUTHOR',
        'FOAM_TAGS',
        'FOAM_WORKSPACE',
    ];
}

/**
 * Replace template variables with actual values
 * Supports all Foam variables plus extensions
 */
export function replaceTemplateVariables(template: string, context: TemplateContext): string {
    const date = context.date || new Date();
    const title = context.title || 'Untitled';
    const author = context.author || 'Unknown';
    const tags = context.tags || [];
    const workspace = context.workspace || 'Workspace';

    // Date variables
    const year = date.getFullYear();
    const yearShort = String(year).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthName = monthNames[date.getMonth()];
    const monthNameShort = monthNamesShort[date.getMonth()];
    const dayName = dayNames[date.getDay()];
    const dayNameShort = dayNamesShort[date.getDay()];

    // Format tags for frontmatter
    const tagsString = tags.length > 0 ? tags.map(t => `  - ${t}`).join('\n') : '';

    let result = template;

    // Replace all variables
    result = result.replace(/\$\{FOAM_TITLE\}/g, title);
    result = result.replace(/\$\{FOAM_DATE_YEAR\}/g, String(year));
    result = result.replace(/\$\{FOAM_DATE_YEAR_SHORT\}/g, yearShort);
    result = result.replace(/\$\{FOAM_DATE_MONTH\}/g, month);
    result = result.replace(/\$\{FOAM_DATE_DATE\}/g, day);
    result = result.replace(/\$\{FOAM_DATE_MONTH_NAME\}/g, monthName);
    result = result.replace(/\$\{FOAM_DATE_MONTH_NAME_SHORT\}/g, monthNameShort);
    result = result.replace(/\$\{FOAM_DATE_DAY_NAME\}/g, dayName);
    result = result.replace(/\$\{FOAM_DATE_DAY_NAME_SHORT\}/g, dayNameShort);
    result = result.replace(/\$\{FOAM_DATE_HOUR\}/g, hour);
    result = result.replace(/\$\{FOAM_DATE_MINUTE\}/g, minute);
    result = result.replace(/\$\{FOAM_AUTHOR\}/g, author);
    result = result.replace(/\$\{FOAM_TAGS\}/g, tagsString);
    result = result.replace(/\$\{FOAM_WORKSPACE\}/g, workspace);

    return result;
}

/**
 * Get default templates
 * These can be customized by users via .templates folder
 */
export function getDefaultTemplates(): Map<string, string> {
    const templates = new Map<string, string>();

    templates.set('Blank Note', `# \${FOAM_TITLE}

`);

    templates.set('Meeting Notes', `---
title: \${FOAM_TITLE}
date: \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}
tags:
  - meeting
---

# \${FOAM_TITLE}

**Date:** \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}
**Attendees:**

## Agenda
-

## Discussion
-

## Action Items
- [ ]

## Next Steps
-
`);

    templates.set('Project Note', `---
title: \${FOAM_TITLE}
date: \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}
tags:
  - project
status: in-progress
---

# \${FOAM_TITLE}

## Overview
Brief description of the project.

## Goals
-

## Tasks
- [ ]

## Resources
- [[Related Note]]

## Notes
-
`);

    templates.set('Research Note', `---
title: \${FOAM_TITLE}
date: \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}
tags:
  - research
---

# \${FOAM_TITLE}

## Summary
Brief summary of the research topic.

## Key Findings
-

## Sources
-

## Related Topics
- [[Related Topic]]

## Questions
-
`);

    templates.set('Daily Log', `---
title: \${FOAM_TITLE}
date: \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}
tags:
  - daily
---

# \${FOAM_DATE_DAY_NAME}, \${FOAM_DATE_MONTH_NAME} \${FOAM_DATE_DATE}, \${FOAM_DATE_YEAR}

## Today's Goals
-

## Completed
-

## Notes
-

## Tomorrow
-
`);

    return templates;
}
