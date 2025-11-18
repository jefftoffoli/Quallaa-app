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
import { WikiLink, serializeWikiLinkToMarkdown } from './tiptap-wiki-link';

// Regex for wiki links - matches [[target]] and [[target|display]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Placeholder to protect wiki links during markdown parsing
const WIKI_LINK_PLACEHOLDER = '\u0000WIKILINK';

export interface TipTapRendererProps {
    /** Markdown content to display */
    content: string;
    /** Called when content changes, with new markdown */
    onChange?: (markdown: string) => void;
    /** Whether the editor is read-only */
    readOnly?: boolean;
    /** Called when editor is ready */
    onEditorReady?: (editor: Editor) => void;
    /** Called when a wiki link is clicked */
    onWikiLinkClick?: (target: string) => void;
}

export const TipTapRenderer: React.FC<TipTapRendererProps> = ({
    content,
    onChange,
    readOnly = false,
    onEditorReady,
    onWikiLinkClick
}) => {
    // Store extracted wiki links during parsing
    const wikiLinksRef = React.useRef<Array<{ target: string; displayText?: string }>>([]);

    // Pre-process markdown to extract and protect wiki links
    const preprocessMarkdown = (markdown: string): string => {
        wikiLinksRef.current = [];
        let index = 0;

        return markdown.replace(WIKI_LINK_REGEX, (match, target, displayText) => {
            wikiLinksRef.current.push({
                target: target.trim(),
                displayText: displayText?.trim()
            });
            // Replace with placeholder that won't be parsed as markdown
            return `${WIKI_LINK_PLACEHOLDER}${index++}${WIKI_LINK_PLACEHOLDER}`;
        });
    };

    // Post-process to restore wiki links in the parsed content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restoreWikiLinks = (json: any): any => {
        if (!json) {return json; }

        if (typeof json === 'string') {
            // Check for wiki link placeholders in text
            const placeholderRegex = new RegExp(`${WIKI_LINK_PLACEHOLDER}(\\d+)${WIKI_LINK_PLACEHOLDER}`, 'g');
            if (placeholderRegex.test(json)) {
                // This text contains wiki links - split and create mixed content
                const parts: Array<{ type: string; text?: string; attrs?: { target: string; displayText?: string } }> = [];
                let lastIndex = 0;
                let match;
                placeholderRegex.lastIndex = 0;

                while ((match = placeholderRegex.exec(json))) {
                    // Add text before placeholder
                    if (match.index > lastIndex) {
                        parts.push({ type: 'text', text: json.slice(lastIndex, match.index) });
                    }
                    // Add wiki link node
                    const linkIndex = parseInt(match[1], 10);
                    const link = wikiLinksRef.current[linkIndex];
                    if (link) {
                        parts.push({
                            type: 'wikiLink',
                            attrs: { target: link.target, displayText: link.displayText }
                        });
                    }
                    lastIndex = match.index + match[0].length;
                }
                // Add remaining text
                if (lastIndex < json.length) {
                    parts.push({ type: 'text', text: json.slice(lastIndex) });
                }
                return parts;
            }
            return json;
        }

        if (Array.isArray(json)) {
            // Flatten the array since restoreWikiLinks might return arrays
            const result: unknown[] = [];
            for (const item of json) {
                const processed = restoreWikiLinks(item);
                if (Array.isArray(processed)) {
                    result.push(...processed);
                } else {
                    result.push(processed);
                }
            }
            return result;
        }

        if (typeof json === 'object') {
            const result: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(json)) {
                if (key === 'text' && typeof value === 'string') {
                    const processed = restoreWikiLinks(value);
                    if (Array.isArray(processed)) {
                        // Text node needs to become multiple nodes
                        return processed;
                    }
                    result[key] = processed;
                } else if (key === 'content' && Array.isArray(value)) {
                    result[key] = restoreWikiLinks(value);
                } else {
                    result[key] = restoreWikiLinks(value);
                }
            }
            return result;
        }

        return json;
    };

    // Serialize ProseMirror doc to markdown with wiki link support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializeToMarkdown = (doc: any): string => {
        // First serialize with default serializer
        let markdown = defaultMarkdownSerializer.serialize(doc);

        // The wiki link nodes will be serialized as their display text
        // We need to find them in the doc and restore the [[]] syntax
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractWikiLinks = (node: any): void => {
            if (node.type === 'wikiLink') {
                const target = node.attrs?.target || '';
                const displayText = node.attrs?.displayText;
                const wikiLinkText = serializeWikiLinkToMarkdown(target, displayText);
                const searchText = displayText || target;
                // Replace the plain text with wiki link syntax
                markdown = markdown.replace(searchText, wikiLinkText);
            }
            if (node.content) {
                node.content.forEach(extractWikiLinks);
            }
        };

        const docJson = doc.toJSON ? doc.toJSON() : doc;
        if (docJson.content) {
            docJson.content.forEach(extractWikiLinks);
        }

        return markdown;
    };

    // Parse markdown content to ProseMirror JSON
    const parseMarkdown = (markdown: string): object | undefined => {
        if (!markdown) {return undefined; }

        // Pre-process to extract wiki links
        const processed = preprocessMarkdown(markdown);

        // Parse with default parser
        const doc = defaultMarkdownParser.parse(processed);
        if (!doc) {return undefined; }

        // Restore wiki links in the JSON
        const json = doc.toJSON();
        return restoreWikiLinks(json);
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            WikiLink.configure({
                onLinkClick: onWikiLinkClick,
            }),
        ],
        // Parse markdown content to ProseMirror document
        content: parseMarkdown(content) || '',
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
                const parsed = parseMarkdown(content);
                if (parsed) {
                    editor.commands.setContent(parsed);
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
