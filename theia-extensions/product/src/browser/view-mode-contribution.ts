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

/**
 * View Mode Contribution - Commands and UI for switching between KB and Developer views
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { FrontendApplicationContribution, StatusBar, StatusBarAlignment, codicon } from '@theia/core/lib/browser';
import { ViewModeManager, ViewMode } from './view-mode-manager';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';

export namespace ViewModeCommands {
    const CATEGORY = 'View Mode';

    export const SWITCH_TO_KB: Command = {
        id: 'view-mode.switch-to-kb',
        category: CATEGORY,
        label: 'Switch to Knowledge Base View',
        iconClass: codicon('book'),
    };

    export const SWITCH_TO_DEVELOPER: Command = {
        id: 'view-mode.switch-to-developer',
        category: CATEGORY,
        label: 'Switch to Developer View',
        iconClass: codicon('code'),
    };

    export const TOGGLE_MODE: Command = {
        id: 'view-mode.toggle',
        category: CATEGORY,
        label: 'Toggle View Mode (KB ↔ Developer)',
        iconClass: codicon('split-horizontal'),
    };
}

const VIEW_MODE_STATUS_BAR_ID = 'view-mode-indicator';

@injectable()
export class ViewModeContribution implements CommandContribution, MenuContribution, FrontendApplicationContribution {
    @inject(ViewModeManager)
    protected readonly viewModeManager: ViewModeManager;

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    @postConstruct()
    protected init(): void {
        // Update status bar when mode changes
        this.viewModeManager.onDidChangeMode(() => {
            this.updateStatusBar();
        });
    }

    async onStart(): Promise<void> {
        // Initialize status bar indicator
        this.updateStatusBar();
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ViewModeCommands.SWITCH_TO_KB, {
            execute: async () => {
                await this.viewModeManager.switchToKBMode();
            },
            isEnabled: () => !this.viewModeManager.isKBMode(),
        });

        registry.registerCommand(ViewModeCommands.SWITCH_TO_DEVELOPER, {
            execute: async () => {
                await this.viewModeManager.switchToDeveloperMode();
            },
            isEnabled: () => !this.viewModeManager.isDeveloperMode(),
        });

        registry.registerCommand(ViewModeCommands.TOGGLE_MODE, {
            execute: async () => {
                await this.viewModeManager.toggleMode();
            },
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        // Add to View menu
        menus.registerMenuAction(CommonMenus.VIEW, {
            commandId: ViewModeCommands.SWITCH_TO_KB.id,
            label: 'Switch to KB View',
            icon: codicon('book'),
            order: '0_view_mode',
        });

        menus.registerMenuAction(CommonMenus.VIEW, {
            commandId: ViewModeCommands.SWITCH_TO_DEVELOPER.id,
            label: 'Switch to Developer View',
            icon: codicon('code'),
            order: '0_view_mode',
        });

        menus.registerMenuAction(CommonMenus.VIEW, {
            commandId: ViewModeCommands.TOGGLE_MODE.id,
            label: 'Toggle View Mode',
            icon: codicon('split-horizontal'),
            order: '0_view_mode',
        });
    }

    protected updateStatusBar(): void {
        const mode = this.viewModeManager.getMode();
        const isKBMode = mode === ViewMode.KnowledgeBase;

        const text = isKBMode ? '$(book) KB View' : '$(code) Developer View';
        const tooltip = this.viewModeManager.getModeDescription();
        const command = ViewModeCommands.TOGGLE_MODE.id;

        this.statusBar.setElement(VIEW_MODE_STATUS_BAR_ID, {
            text,
            tooltip: `${tooltip}\n\nClick to toggle view mode`,
            alignment: StatusBarAlignment.LEFT,
            priority: 100,
            command,
        });
    }
}
