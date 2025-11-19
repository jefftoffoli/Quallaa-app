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
// eslint-disable-next-line import/no-extraneous-dependencies
import * as monaco from '@theia/monaco-editor-core';

export interface MonacoSourceEditorProps {
    /** The markdown content to display */
    content: string;
    /** Called when content changes */
    onChange: (value: string) => void;
    /** Whether the editor is read-only */
    readOnly?: boolean;
}

/**
 * Monaco-based source editor for markdown files.
 * Provides syntax highlighting, line numbers, and a consistent editing experience.
 */
export const MonacoSourceEditor: React.FC<MonacoSourceEditorProps> = ({ content, onChange, readOnly = false }) => {
    const containerRef = React.useRef<HTMLDivElement | undefined>(undefined);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
    const isUpdatingRef = React.useRef(false);

    // Initialize Monaco editor on mount
    React.useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        // Create the Monaco editor instance
        const editor = monaco.editor.create(containerRef.current, {
            value: content,
            language: 'markdown',
            theme: 'vs-dark', // Will be overridden by Theia's theme
            automaticLayout: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            wrappingStrategy: 'advanced',
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: 'var(--monaco-monospace-font)',
            lineHeight: 22,
            padding: { top: 16, bottom: 16 },
            readOnly: readOnly,
            renderLineHighlight: 'line',
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
            },
            // Markdown-specific settings
            quickSuggestions: false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
        });

        editorRef.current = editor;

        // Handle content changes
        const disposable = editor.onDidChangeModelContent(() => {
            if (!isUpdatingRef.current) {
                const newValue = editor.getValue();
                onChange(newValue);
            }
        });

        // Cleanup on unmount
        return () => {
            disposable.dispose();
            editor.dispose();
            editorRef.current = undefined;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Update content when prop changes
    React.useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            const currentValue = editor.getValue();
            if (content !== currentValue) {
                // Prevent onChange from firing during external updates
                isUpdatingRef.current = true;

                // Preserve cursor position
                const position = editor.getPosition();
                const selection = editor.getSelection();

                editor.setValue(content);

                // Restore cursor position
                if (position) {
                    editor.setPosition(position);
                }
                if (selection) {
                    editor.setSelection(selection);
                }

                isUpdatingRef.current = false;
            }
        }
    }, [content]);

    // Update read-only state
    React.useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            editor.updateOptions({ readOnly });
        }
    }, [readOnly]);

    return (
        <div
            ref={containerRef}
            className="quallaa-monaco-source-editor"
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}
        />
    );
};
