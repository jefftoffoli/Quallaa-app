/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Quick Switcher for jumping between notes
 * Following Foam's workspace-symbol-provider pattern, adapted for Theia
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { QuickPickService, QuickPickItem } from '@theia/core/lib/common/quick-pick-service';
import { OpenerService, open } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import { KnowledgeBaseService, Note } from '../../common/knowledge-base-protocol';
import URI from '@theia/core/lib/common/uri';

export const OPEN_QUICK_SWITCHER_COMMAND: Command = {
    id: 'knowledge-base.quick-switcher',
    label: 'Quick Switcher: Open Note',
};

@injectable()
export class QuickSwitcherContribution implements CommandContribution {
    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    private allNotes: Note[] = [];

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(OPEN_QUICK_SWITCHER_COMMAND, {
            execute: async () => {
                await this.openQuickSwitcher();
            },
        });
    }

    private async openQuickSwitcher(): Promise<void> {
        try {
            // Load all notes
            this.allNotes = await this.knowledgeBaseService.getAllNotes();

            // Create quick pick items
            const items = this.allNotes.map(note => this.createQuickPickItem(note));

            // Show quick pick with filtering support
            // The selected item's execute() function will be called automatically
            await this.quickPickService.show(items, {
                placeholder: 'Type to search notes...',
            });
        } catch (error) {
            console.error('[QuickSwitcher] Failed to open quick switcher:', error);
        }
    }

    private createQuickPickItem(note: Note): QuickPickItem {
        return {
            label: note.title,
            description: note.path,
            execute: () => {
                const uri = new URI(note.uri);
                open(this.openerService, uri);
            },
        };
    }
}
