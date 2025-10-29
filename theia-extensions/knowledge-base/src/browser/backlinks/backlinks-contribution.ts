/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Contribution for registering the backlinks panel
 * Following Foam's connections panel pattern
 */

import { injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { BacklinksWidget, BACKLINKS_WIDGET_ID } from './backlinks-widget';

export const TOGGLE_BACKLINKS_COMMAND: Command = {
    id: 'knowledge-base.toggle-backlinks',
    label: 'Toggle Backlinks Panel',
};

@injectable()
export class BacklinksContribution extends AbstractViewContribution<BacklinksWidget> {
    constructor() {
        super({
            widgetId: BACKLINKS_WIDGET_ID,
            widgetName: 'Backlinks',
            defaultWidgetOptions: {
                area: 'right',
                rank: 500,
            },
            toggleCommandId: TOGGLE_BACKLINKS_COMMAND.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }
}
