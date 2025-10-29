/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Contribution for daily notes feature
 * Following Foam's dated-notes pattern
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import { OpenerService, open } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { getDailyNoteFileName, replaceDailyNoteVariables, getDefaultDailyNoteTemplate } from './daily-notes-util';

export const OPEN_DAILY_NOTE_COMMAND: Command = {
    id: 'knowledge-base.open-daily-note',
    label: "Open Today's Note",
};

@injectable()
export class DailyNotesContribution implements CommandContribution {
    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(OPEN_DAILY_NOTE_COMMAND, {
            execute: async () => {
                try {
                    const date = new Date();
                    const filename = getDailyNoteFileName(date);

                    // Get workspace root
                    const roots = await this.workspaceService.roots;
                    if (!roots || roots.length === 0) {
                        console.error('[DailyNotes] No workspace root found');
                        return;
                    }

                    // Construct the daily note path - following wiki-link-contribution pattern
                    const workspaceRootPath = roots[0].resource.toString();
                    const dailyNotePath = `${workspaceRootPath}/${filename}`;
                    const dailyNoteUri = new URI(dailyNotePath);

                    // Check if file exists
                    const exists = await this.fileService.exists(dailyNoteUri);

                    if (exists) {
                        // File exists, just open it
                        console.log(`[DailyNotes] Opening existing daily note: ${dailyNoteUri.toString()}`);
                        await open(this.openerService, dailyNoteUri);
                    } else {
                        // File doesn't exist, create it from template
                        console.log(`[DailyNotes] Creating new daily note: ${dailyNoteUri.toString()}`);

                        const template = getDefaultDailyNoteTemplate();
                        const content = replaceDailyNoteVariables(template, date);

                        await this.fileService.create(dailyNoteUri, content);
                        await open(this.openerService, dailyNoteUri);
                    }
                } catch (error) {
                    console.error('[DailyNotes] Failed to open/create daily note:', error);
                }
            },
        });
    }
}
