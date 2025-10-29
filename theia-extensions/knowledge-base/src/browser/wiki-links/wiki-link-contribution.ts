/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Contribution that registers wiki link features with Monaco editors
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, OpenerService, open } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as monaco from '@theia/monaco-editor-core';
import { WikiLinkCompletionProvider } from './wiki-link-completion-provider';
import { WikiLinkProvider } from './wiki-link-provider';
import { WikiLinkNavigator } from './wiki-link-navigator';
import { DisposableCollection } from '@theia/core';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { KnowledgeBaseService } from '../../common/knowledge-base-protocol';
import URI from '@theia/core/lib/common/uri';

// Command definition
export const CREATE_NOTE_COMMAND: Command = {
    id: 'knowledge-base.create-note',
    label: 'Create Note from Wiki Link',
};

@injectable()
export class WikiLinkContribution implements FrontendApplicationContribution, CommandContribution {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(WikiLinkCompletionProvider)
    protected readonly completionProvider: WikiLinkCompletionProvider;

    @inject(WikiLinkProvider)
    protected readonly linkProvider: WikiLinkProvider;

    @inject(WikiLinkNavigator)
    protected readonly linkNavigator: WikiLinkNavigator;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    private readonly toDispose = new DisposableCollection();

    async onStart(): Promise<void> {
        console.log('[WikiLinkContribution] Registering wiki link features');

        // Register completion provider for markdown files
        this.toDispose.push(monaco.languages.registerCompletionItemProvider('markdown', this.completionProvider));
        this.toDispose.push(monaco.languages.registerCompletionItemProvider('plaintext', this.completionProvider));

        // Register link provider for markdown files (provides automatic underlines like Foam)
        this.toDispose.push(monaco.languages.registerLinkProvider('markdown', this.linkProvider));
        this.toDispose.push(monaco.languages.registerLinkProvider('plaintext', this.linkProvider));

        // Attach navigator to markdown editors as they open
        this.editorManager.onCreated(editor => {
            // Get the MonacoEditor instance (might be wrapped)
            let monacoEditor: MonacoEditor | undefined;

            if (editor instanceof MonacoEditor) {
                monacoEditor = editor;
            } else if ('editor' in editor && editor.editor instanceof MonacoEditor) {
                // Handle EditorPreviewWidget and similar wrappers
                monacoEditor = editor.editor as MonacoEditor;
            }

            if (monacoEditor) {
                const model = monacoEditor.getControl().getModel();
                const languageId = model?.getLanguageId();
                const uri = model?.uri.toString();

                // Check if it's a markdown file by extension (language ID might not be set yet)
                const isMarkdown = languageId === 'markdown' || uri?.endsWith('.md');

                if (model && isMarkdown) {
                    this.linkNavigator.attach(monacoEditor);
                }
            }
        });

        console.log('[WikiLinkContribution] Wiki link features registered');
    }

    /**
     * Register commands for wiki link operations
     */
    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(CREATE_NOTE_COMMAND, {
            execute: async (argsString: string) => {
                try {
                    // Parse arguments from command URI
                    const params = JSON.parse(decodeURIComponent(argsString)) as { target: string; sourceUri: string };
                    const { target, sourceUri } = params;

                    console.log(`[WikiLinkContribution] Creating note: ${target}`);

                    // Backend returns the URI where file should be created
                    const newNoteUriString = await this.knowledgeBaseService.createNote(target, sourceUri);
                    const createdUri = new URI(newNoteUriString);

                    // Frontend creates the actual file with a title
                    const content = `# ${target}\n\n`;
                    await this.fileService.create(createdUri, content);

                    // Open the newly created note
                    await open(this.openerService, createdUri);
                } catch (error) {
                    console.error('[WikiLinkContribution] Failed to create note:', error);
                }
            },
        });
    }

    onStop(): void {
        this.toDispose.dispose();
    }
}
