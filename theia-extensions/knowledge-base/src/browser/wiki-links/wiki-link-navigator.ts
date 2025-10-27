/**
 * Handles navigation when clicking on wiki links
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import * as monaco from '@theia/monaco-editor-core';
import { OpenerService, open } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { KnowledgeBaseService } from '../../common/knowledge-base-protocol';
import { isPositionInWikiLink } from '../../common/wiki-link-parser';
import { Disposable, DisposableCollection } from '@theia/core';
import { KeyCode, KeyMod } from '@theia/monaco-editor-core';

@injectable()
export class WikiLinkNavigator implements Disposable {
    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    private readonly toDispose = new DisposableCollection();

    dispose(): void {
        this.toDispose.dispose();
    }

    /**
     * Attach the link navigator to a Monaco editor
     */
    attach(editor: MonacoEditor): void {
        const monacoEditor = editor.getControl();

        // Handle Cmd/Ctrl+Click on links
        this.toDispose.push(
            monacoEditor.onMouseDown(async event => {
                // Check for Cmd/Ctrl key
                if (!event.event.metaKey && !event.event.ctrlKey) {
                    return;
                }

                const position = event.target.position;
                if (!position) {
                    return;
                }

                await this.handleLinkClick(monacoEditor, position);
            })
        );

        // Add a command for "Go to Definition" on wiki links (F12 or Cmd+Click)
        this.toDispose.push(
            monacoEditor.addAction({
                id: 'knowledge-base.follow-wiki-link',
                label: 'Follow Wiki Link',
                keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
                contextMenuGroupId: 'navigation',
                contextMenuOrder: 1.5,
                run: async editor => {
                    const position = editor.getPosition();
                    if (position) {
                        await this.handleLinkClick(editor, position);
                    }
                }
            })
        );
    }

    /**
     * Handle clicking on a wiki link
     * If the link is broken, creates a new note
     */
    private async handleLinkClick(editor: monaco.editor.ICodeEditor, position: monaco.Position): Promise<void> {
        const model = editor.getModel();
        if (!model) {
            return;
        }

        const content = model.getValue();
        const offset = model.getOffsetAt(position);
        const link = isPositionInWikiLink(content, offset);

        if (!link) {
            return;
        }

        // Try to resolve the link target
        let note = await this.knowledgeBaseService.resolveWikiLink(link.target);

        if (!note) {
            // Broken link - create the note
            console.log(`Wiki link target not found, creating: ${link.target}`);

            try {
                const currentFileUri = model.uri.toString();
                const newNoteUri = await this.knowledgeBaseService.createNote(link.target, currentFileUri);

                // Open the newly created note
                const uri = new URI(newNoteUri);
                await open(this.openerService, uri);
                return;
            } catch (error) {
                console.error(`Failed to create note for broken link: ${link.target}`, error);
                return;
            }
        }

        // Open the existing note
        const uri = new URI(note.uri);
        await open(this.openerService, uri);
    }
}
