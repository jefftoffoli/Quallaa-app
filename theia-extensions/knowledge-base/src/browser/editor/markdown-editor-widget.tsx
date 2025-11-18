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
import { URI } from '@theia/core/lib/common/uri';
import { TipTapRenderer } from './tiptap-renderer';
import { MessageService } from '@theia/core';
import { Widget } from '@theia/core/lib/browser';

@injectable()
export class MarkdownEditorWidget extends ReactWidget {

    static readonly ID = 'quallaa-markdown-editor';
    static readonly LABEL = 'Markdown Editor';

    @inject(MessageService)
    protected readonly messageService: MessageService;

    protected uri: URI | undefined;

    @postConstruct()
    protected init(): void {
        this.id = MarkdownEditorWidget.ID;
        this.title.label = MarkdownEditorWidget.LABEL;
        this.title.caption = MarkdownEditorWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-book'; // Book icon to distinguish from Monaco
        this.addClass('quallaa-markdown-editor');
    }

    public setUri(uri: URI): void {
        this.uri = uri;
        this.title.label = uri.path.name;
        this.title.caption = uri.path.toString();
        this.update();
    }

    public getUri(): URI | undefined {
        return this.uri;
    }

    protected render(): React.ReactNode {
        // In Phase 3.3 we will load actual file content here
        return <TipTapRenderer initialContent={`<h1>${this.uri?.path.name || 'New Note'}</h1><p>This is the new Live Preview editor.</p>`} />;
    }

    /**
     * Type guard for MarkdownEditorWidget
     */
    static is(widget: Widget | undefined): widget is MarkdownEditorWidget {
        return widget !== undefined && widget.id.startsWith(MarkdownEditorWidget.ID);
    }
}
