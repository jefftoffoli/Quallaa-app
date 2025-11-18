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

import * as React from '@theia/core/shared/react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';

export interface TipTapRendererProps {
    /** Markdown content to display */
    content: string;
    /** Called when content changes, with new markdown */
    onChange?: (markdown: string) => void;
    /** Whether the editor is read-only */
    readOnly?: boolean;
    /** Called when editor is ready */
    onEditorReady?: (editor: Editor) => void;
}

export const TipTapRenderer: React.FC<TipTapRendererProps> = ({
    content,
    onChange,
    readOnly = false,
    onEditorReady
}) => {
    // Helper function to serialize ProseMirror doc to markdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializeToMarkdown = (doc: any): string => defaultMarkdownSerializer.serialize(doc);

    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        // Parse markdown content to ProseMirror document
        content: content ? defaultMarkdownParser.parse(content)?.toJSON() : '',
        editable: !readOnly,
        editorProps: {
            attributes: {
                class: 'quallaa-tiptap-instance',
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            if (onChange) {
                // Serialize ProseMirror document to markdown
                const markdown = serializeToMarkdown(currentEditor.state.doc);
                onChange(markdown);
            }
        },
        onCreate: ({ editor: createdEditor }) => {
            if (onEditorReady) {
                onEditorReady(createdEditor);
            }
        },
    });

    // Update content when prop changes (e.g., file reload or mode switch)
    React.useEffect(() => {
        if (editor && content) {
            // Compare current markdown with new content
            const currentMarkdown = serializeToMarkdown(editor.state.doc);
            if (content !== currentMarkdown) {
                // Parse new markdown and set as content
                const parsedDoc = defaultMarkdownParser.parse(content);
                if (parsedDoc) {
                    editor.commands.setContent(parsedDoc.toJSON());
                }
            }
        }
    }, [content, editor]);

    return (
        <div className='quallaa-editor-container'>
            <div className='quallaa-tiptap-editor'>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
