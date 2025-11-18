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
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export interface TipTapRendererProps {
    initialContent?: string;
}

export const TipTapRenderer: React.FC<TipTapRendererProps> = ({ initialContent }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: initialContent || '<h1>Welcome to Quallaa Live Preview</h1><p>Start typing...</p>',
        editorProps: {
            attributes: {
                class: 'quallaa-tiptap-instance',
            },
        },
    });

    return (
        <div className='quallaa-editor-container'>
            <div className='quallaa-editor-toolbar'>
                {/* Toolbar buttons will go here in Phase 3.2 */}
                <span style={{ fontSize: '11px', color: 'var(--kb-text-muted)' }}>Live Preview Mode</span>
            </div>
            <div className='quallaa-tiptap-editor'>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
