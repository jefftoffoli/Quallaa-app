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
import * as monaco from '@theia/monaco-editor-core';
import { WikiLinkCompletionProvider } from './wiki-link-completion-provider';
import { WikiLinkDetector } from './wiki-link-detector';
import { WikiLinkNavigator } from './wiki-link-navigator';
import { DisposableCollection } from '@theia/core';

@injectable()
export class WikiLinkContribution implements FrontendApplicationContribution {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(WikiLinkCompletionProvider)
    protected readonly completionProvider: WikiLinkCompletionProvider;

    @inject(WikiLinkDetector)
    protected readonly linkDetector: WikiLinkDetector;

    @inject(WikiLinkNavigator)
    protected readonly linkNavigator: WikiLinkNavigator;

    private readonly toDispose = new DisposableCollection();

    async onStart(): Promise<void> {
        // Register completion provider for markdown files
        // Register for both 'markdown' and 'plaintext' since .md files might initially be detected as plaintext
        this.toDispose.push(monaco.languages.registerCompletionItemProvider('markdown', this.completionProvider));
        this.toDispose.push(monaco.languages.registerCompletionItemProvider('plaintext', this.completionProvider));

        // Attach features to markdown editors as they open
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
                    this.linkDetector.attach(monacoEditor);
                    this.linkNavigator.attach(monacoEditor);
                }
            }
        });

        // Add CSS for wiki link styling
        this.addWikiLinkStyles();
    }

    onStop(): void {
        this.toDispose.dispose();
    }

    /**
     * Add CSS styles for wiki links
     */
    private addWikiLinkStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            /* Resolved wiki links - styled like hyperlinks */
            .wiki-link-resolved {
                color: var(--vscode-textLink-foreground, #0066cc);
                text-decoration: underline;
                cursor: pointer;
            }

            .wiki-link-resolved:hover {
                color: var(--vscode-textLink-activeForeground, #004499);
            }

            /* Unresolved wiki links - styled as warnings */
            .wiki-link-unresolved {
                color: var(--vscode-editorWarning-foreground, #ff9900);
                text-decoration: wavy underline;
                cursor: not-allowed;
            }

            /* Dark theme adjustments */
            .theia-dark .wiki-link-resolved {
                color: var(--vscode-textLink-foreground, #4daafc);
            }

            .theia-dark .wiki-link-unresolved {
                color: var(--vscode-editorWarning-foreground, #ffcc00);
            }
        `;
        document.head.appendChild(style);
    }
}
