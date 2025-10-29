/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Daily notes utilities following Foam's pattern
 */

/**
 * Format a date for filename: YYYY-MM-DD
 * Following Foam's default format
 */
export function formatDateForFilename(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get the daily note filename for a given date
 * Following Foam's pattern: yyyy-mm-dd.md
 */
export function getDailyNoteFileName(date: Date): string {
    return `${formatDateForFilename(date)}.md`;
}

/**
 * Get the title for a daily note
 * Following Foam's pattern
 */
export function getDailyNoteTitle(date: Date): string {
    return formatDateForFilename(date);
}

/**
 * Replace template variables with actual values
 * Following Foam's variable pattern:
 * - ${FOAM_DATE_YEAR}
 * - ${FOAM_DATE_MONTH}
 * - ${FOAM_DATE_DATE}
 * - ${FOAM_TITLE}
 */
export function replaceDailyNoteVariables(template: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const title = getDailyNoteTitle(date);

    return template
        .replace(/\$\{FOAM_DATE_YEAR\}/g, String(year))
        .replace(/\$\{FOAM_DATE_MONTH\}/g, month)
        .replace(/\$\{FOAM_DATE_DATE\}/g, day)
        .replace(/\$\{FOAM_TITLE\}/g, title);
}

/**
 * Get the default daily note template
 * Following Foam's default template structure
 */
export function getDefaultDailyNoteTemplate(): string {
    return `# \${FOAM_TITLE}

`;
}
