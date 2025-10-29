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
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as monaco from '@theia/monaco-editor-core';
import { WikiLinkCompletionProvider } from './wiki-link-completion-provider';
import { WikiLinkProvider } from './wiki-link-provider';
import { WikiLinkNavigator } from './wiki-link-navigator';
import { DisposableCollection } from '@theia/core';

@injectable()
export class WikiLinkContribution implements FrontendApplicationContribution {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(WikiLinkCompletionProvider)
    protected readonly completionProvider: WikiLinkCompletionProvider;

    @inject(WikiLinkProvider)
    protected readonly linkProvider: WikiLinkProvider;

    @inject(WikiLinkNavigator)
    protected readonly linkNavigator: WikiLinkNavigator;

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

    onStop(): void {
        this.toDispose.dispose();
    }
}
