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
 * Detects and decorates wiki links in Monaco editor
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import * as monaco from '@theia/monaco-editor-core';
import { KnowledgeBaseService } from '../../common/knowledge-base-protocol';
import { parseWikiLinks } from '../../common/wiki-link-parser';
import { Disposable, DisposableCollection } from '@theia/core';

@injectable()
export class WikiLinkDetector implements Disposable {
    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    private readonly decorations = new Map<string, string[]>();
    private readonly toDispose = new DisposableCollection();

    dispose(): void {
        this.toDispose.dispose();
        this.decorations.clear();
    }

    /**
     * Attach the link detector to a Monaco editor
     */
    attach(editor: MonacoEditor): void {
        const monacoEditor = editor.getControl();

        // Initial decoration on document open
        this.updateDecorations(monacoEditor);

        // For Phase 1.2: Only detect on document open
        // Phase 2+ will add real-time detection with debouncing
        // Uncomment below to enable real-time detection:
        //
        // this.toDispose.push(
        //     monacoEditor.onDidChangeModelContent(() => {
        //         this.updateDecorationsDebounced(monacoEditor);
        //     })
        // );
    }

    /**
     * Update link decorations in the editor
     */
    private async updateDecorations(editor: monaco.editor.IStandaloneCodeEditor): Promise<void> {
        const model = editor.getModel();
        if (!model || model.getLanguageId() !== 'markdown') {
            return;
        }

        const content = model.getValue();
        const links = parseWikiLinks(content);

        // Resolve which links exist
        const decorations: monaco.editor.IModelDeltaDecoration[] = [];
        for (const link of links) {
            const resolved = await this.knowledgeBaseService.resolveWikiLink(link.target);
            const startPos = model.getPositionAt(link.start);
            const endPos = model.getPositionAt(link.end);

            decorations.push({
                range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                options: {
                    inlineClassName: resolved ? 'wiki-link-resolved' : 'wiki-link-unresolved',
                    hoverMessage: resolved
                        ? { value: `Go to **${link.target}**` }
                        : { value: `Cmd+Click to create **${link.target}**` },
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                }
            });
        }

        // Apply decorations
        const modelUri = model.uri.toString();
        const oldDecorations = this.decorations.get(modelUri) || [];
        const newDecorations = model.deltaDecorations(oldDecorations, decorations);
        this.decorations.set(modelUri, newDecorations);
    }
}
