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
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Saveable, SaveableSource } from '@theia/core/lib/browser/saveable';
import { URI } from '@theia/core/lib/common/uri';
import { TipTapRenderer } from './tiptap-renderer';
import { MessageService, Emitter, Event } from '@theia/core';
import { Widget } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

// Source editor component - textarea for now, can be upgraded to Monaco later
const SourceEditor: React.FC<{
    content: string;
    onChange: (value: string) => void;
}> = ({ content, onChange }) => (
    <textarea
        className='quallaa-source-editor'
        style={{
            width: '100%',
            height: '100%',
            background: 'var(--theia-editor-background)',
            color: 'var(--theia-editor-foreground)',
            border: 'none',
            padding: '24px 48px',
            resize: 'none',
            fontFamily: 'var(--monaco-monospace-font)',
            fontSize: 'var(--kb-font-size-medium)',
            lineHeight: '1.6',
            outline: 'none',
        }}
        value={content}
        onChange={e => onChange(e.target.value)}
    />
);

@injectable()
export class MarkdownEditorWidget extends ReactWidget implements Saveable, SaveableSource {

    static readonly ID = 'quallaa-markdown-editor';
    static readonly LABEL = 'Markdown Editor';

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(FileService)
    protected readonly fileService: FileService;

    protected uri: URI | undefined;
    protected content: string = '';
    protected originalContent: string = '';
    protected _dirty: boolean = false;
    protected mode: 'preview' | 'source' = 'preview';

    // Saveable implementation
    readonly autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange' = 'off';

    protected readonly onDirtyChangedEmitter = new Emitter<void>();
    readonly onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;

    protected readonly onContentChangedEmitter = new Emitter<void>();
    readonly onContentChanged: Event<void> = this.onContentChangedEmitter.event;

    get saveable(): Saveable {
        return this;
    }

    get dirty(): boolean {
        return this._dirty;
    }

    @postConstruct()
    protected init(): void {
        this.id = MarkdownEditorWidget.ID;
        this.title.label = MarkdownEditorWidget.LABEL;
        this.title.caption = MarkdownEditorWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-book';
        this.addClass('quallaa-markdown-editor');
    }

    public async setUri(uri: URI): Promise<void> {
        this.uri = uri;
        this.title.label = uri.path.name;
        this.title.caption = uri.path.toString();

        // Load file content
        await this.loadContent();
        this.update();
    }

    public getUri(): URI | undefined {
        return this.uri;
    }

    public toggleMode(): void {
        this.mode = this.mode === 'preview' ? 'source' : 'preview';
        this.update();
    }

    public getMode(): 'preview' | 'source' {
        return this.mode;
    }

    protected async loadContent(): Promise<void> {
        if (!this.uri) {
            return;
        }

        try {
            const fileContent = await this.fileService.read(this.uri);
            this.content = fileContent.value;
            this.originalContent = this.content;
            this.setDirty(false);
        } catch (error) {
            this.messageService.error(`Failed to load file: ${error}`);
            this.content = '';
            this.originalContent = '';
        }
    }

    protected setDirty(dirty: boolean): void {
        if (this._dirty !== dirty) {
            this._dirty = dirty;
            this.onDirtyChangedEmitter.fire();
            // Update title to show dirty indicator
            if (this.uri) {
                this.title.label = dirty ? `${this.uri.path.name} •` : this.uri.path.name;
            }
        }
    }

    protected handleContentChange = (markdown: string): void => {
        this.content = markdown;
        const isDirty = this.content !== this.originalContent;
        this.setDirty(isDirty);
        this.onContentChangedEmitter.fire();
    };

    async save(): Promise<void> {
        if (!this.uri || !this.dirty) {
            return;
        }

        try {
            await this.fileService.write(this.uri, this.content);
            this.originalContent = this.content;
            this.setDirty(false);
            this.messageService.info(`Saved: ${this.uri.path.name}`);
        } catch (error) {
            this.messageService.error(`Failed to save file: ${error}`);
            throw error;
        }
    }

    async revert(): Promise<void> {
        await this.loadContent();
        this.update();
    }

    createSnapshot(): { value: string } {
        return { value: this.content };
    }

    applySnapshot(snapshot: { value: string }): void {
        this.content = snapshot.value;
        this.setDirty(this.content !== this.originalContent);
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Toolbar with mode toggle */}
                <div className='quallaa-editor-toolbar'>
                    <button
                        className='theia-button secondary'
                        onClick={() => this.toggleMode()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                        }}
                    >
                        <i className={`codicon ${this.mode === 'preview' ? 'codicon-code' : 'codicon-book'}`}></i>
                        {this.mode === 'preview' ? 'Source' : 'Preview'}
                    </button>
                    <span style={{ fontSize: '11px', color: 'var(--kb-text-muted)', marginLeft: 'auto' }}>
                        {this.mode === 'preview' ? 'Live Preview' : 'Source Mode'}
                    </span>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {this.mode === 'preview' ? (
                        <TipTapRenderer
                            content={this.content}
                            onChange={this.handleContentChange}
                        />
                    ) : (
                        <SourceEditor
                            content={this.content}
                            onChange={this.handleContentChange}
                        />
                    )}
                </div>
            </div>
        );
    }

    /**
     * Type guard for MarkdownEditorWidget
     */
    static is(widget: Widget | undefined): widget is MarkdownEditorWidget {
        return widget !== undefined && widget.id.startsWith(MarkdownEditorWidget.ID);
    }
}
