/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Contribution for Knowledge Graph widget
 * Following Foam's dataviz pattern
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, WidgetManager, ApplicationShell } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, Command, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { GRAPH_WIDGET_ID } from './graph-widget';
import { CommonMenus } from '@theia/core/lib/browser';

export const SHOW_GRAPH_COMMAND: Command = {
    id: 'knowledge-base.show-graph',
    label: 'Knowledge Base: Show Graph',
};

@injectable()
export class GraphContribution implements FrontendApplicationContribution, CommandContribution, MenuContribution {
    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    async onStart(): Promise<void> {
        // Widget initialization handled by widget factory
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(SHOW_GRAPH_COMMAND, {
            execute: async () => {
                const widget = await this.widgetManager.getOrCreateWidget(GRAPH_WIDGET_ID);
                this.shell.addWidget(widget, { area: 'main' });
                this.shell.activateWidget(widget.id);
            },
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: SHOW_GRAPH_COMMAND.id,
            label: SHOW_GRAPH_COMMAND.label,
        });
    }
}
