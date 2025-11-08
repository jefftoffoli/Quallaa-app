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
 * Contribution for note templates
 * Allows creating notes from templates with variable substitution
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import { OpenerService, open, QuickPickService, QuickInputService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { getDefaultTemplates, replaceTemplateVariables } from './template-variables';

export const CREATE_FROM_TEMPLATE_COMMAND: Command = {
    id: 'knowledge-base.create-from-template',
    label: 'Knowledge Base: Create Note from Template',
};

@injectable()
export class TemplateContribution implements CommandContribution {
    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(CREATE_FROM_TEMPLATE_COMMAND, {
            execute: async () => {
                try {
                    await this.createNoteFromTemplate();
                } catch (error) {
                    console.error('[Templates] Failed to create note from template:', error);
                }
            },
        });
    }

    private async createNoteFromTemplate(): Promise<void> {
        // Get workspace root
        const roots = await this.workspaceService.roots;
        if (!roots || roots.length === 0) {
            console.error('[Templates] No workspace root found');
            return;
        }
        const workspaceRoot = roots[0].resource;

        // Step 1: Select template
        const templates = getDefaultTemplates();
        const templateItems = Array.from(templates.entries()).map(([name, content]) => ({
            label: name,
            description: this.getTemplateDescription(content),
            template: content,
        }));

        const selectedTemplate = await this.quickPickService.show(templateItems, {
            placeholder: 'Select a template',
        });

        if (!selectedTemplate) {
            return; // User cancelled
        }

        // Step 2: Get note title
        const noteTitle = await this.quickInputService.input({
            prompt: 'Enter note title',
            placeHolder: 'My New Note',
        });

        if (!noteTitle) {
            return; // User cancelled
        }

        // Step 3: Create filename from title
        const filename = this.createFilename(noteTitle);
        const noteUri = new URI(`${workspaceRoot.toString()}/${filename}`);

        // Check if file already exists
        const exists = await this.fileService.exists(noteUri);
        if (exists) {
            console.warn('[Templates] File already exists:', noteUri.toString());
            // Could show a confirmation dialog here
            return;
        }

        // Step 4: Replace template variables
        const noteContent = replaceTemplateVariables(selectedTemplate.template, {
            title: noteTitle,
            date: new Date(),
            workspace: roots[0].resource.path.base,
        });

        // Step 5: Create file and open
        await this.fileService.create(noteUri, noteContent);
        await open(this.openerService, noteUri);

        console.log('[Templates] Created note from template:', noteUri.toString());
    }

    private createFilename(title: string): string {
        // Convert title to filename: "My Note" -> "my-note.md"
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single

        return `${slug}.md`;
    }

    private getTemplateDescription(content: string): string {
        // Extract first line or frontmatter description
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            const firstLine = lines[0].replace(/^#\s*/, '').trim();
            return firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
        }
        return '';
    }
}
