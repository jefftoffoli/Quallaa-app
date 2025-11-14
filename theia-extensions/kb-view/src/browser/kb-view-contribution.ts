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

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { ViewModeService } from './view-mode-service';
import { MessageService } from '@theia/core/lib/common/message-service';

export namespace KBViewCommands {
    export const TOGGLE_MODE: Command = {
        id: 'kb-view.toggleMode',
        category: 'View',
        label: 'Toggle KB View / Developer Mode',
    };

    export const SWITCH_TO_KB_VIEW: Command = {
        id: 'kb-view.switchToKBView',
        category: 'View',
        label: 'Switch to KB View Mode',
    };

    export const SWITCH_TO_DEVELOPER: Command = {
        id: 'kb-view.switchToDeveloper',
        category: 'View',
        label: 'Switch to Developer Mode',
    };
}

@injectable()
export class KBViewContribution implements CommandContribution, MenuContribution {
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @postConstruct()
    protected async init(): Promise<void> {
        // Initialize the service when the contribution is created
        await this.viewModeService.initialize();
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(KBViewCommands.TOGGLE_MODE, {
            execute: async () => {
                await this.viewModeService.toggleMode();
                const currentMode = this.viewModeService.currentMode;
                const modeLabel = currentMode === 'kb-view' ? 'KB View' : 'Developer';
                this.messageService.info(`Switched to ${modeLabel} mode`);
            },
        });

        commands.registerCommand(KBViewCommands.SWITCH_TO_KB_VIEW, {
            execute: async () => {
                await this.viewModeService.switchMode('kb-view');
                this.messageService.info('Switched to KB View mode');
            },
            isEnabled: () => this.viewModeService.currentMode === 'developer',
        });

        commands.registerCommand(KBViewCommands.SWITCH_TO_DEVELOPER, {
            execute: async () => {
                await this.viewModeService.switchMode('developer');
                this.messageService.info('Switched to Developer mode');
            },
            isEnabled: () => this.viewModeService.currentMode === 'kb-view',
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        // Add to View menu
        menus.registerMenuAction(CommonMenus.VIEW, {
            commandId: KBViewCommands.TOGGLE_MODE.id,
            label: KBViewCommands.TOGGLE_MODE.label,
            order: '0',
        });

        menus.registerMenuAction(CommonMenus.VIEW, {
            commandId: KBViewCommands.SWITCH_TO_KB_VIEW.id,
            label: KBViewCommands.SWITCH_TO_KB_VIEW.label,
            order: '1',
        });

        menus.registerMenuAction(CommonMenus.VIEW, {
            commandId: KBViewCommands.SWITCH_TO_DEVELOPER.id,
            label: KBViewCommands.SWITCH_TO_DEVELOPER.label,
            order: '2',
        });
    }
}
