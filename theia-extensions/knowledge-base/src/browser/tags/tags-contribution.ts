/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Contribution for tags browser
 * Registers commands, menu items, and keybindings for the tags widget
 */

import { injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { TAGS_WIDGET_ID, TagsWidget } from './tags-widget';

export const TOGGLE_TAGS_COMMAND: Command = {
    id: 'knowledge-base.toggle-tags',
    label: 'Toggle Tags Browser',
};

export const REFRESH_TAGS_COMMAND: Command = {
    id: 'knowledge-base.refresh-tags',
    label: 'Refresh Tags',
};

@injectable()
export class TagsContribution extends AbstractViewContribution<TagsWidget> {
    constructor() {
        super({
            widgetId: TAGS_WIDGET_ID,
            widgetName: 'Tags',
            defaultWidgetOptions: {
                area: 'right',
                rank: 501,
            },
            toggleCommandId: TOGGLE_TAGS_COMMAND.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);

        registry.registerCommand(REFRESH_TAGS_COMMAND, {
            execute: async () => {
                const widget = await this.widget;
                widget.refresh();
            },
        });
    }
}
