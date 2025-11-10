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

import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { SidebarService, SidebarVisibilityChange } from '../../common/kb-view-protocol';
import { SidebarWidget } from './sidebar-widget';

/**
 * Service that manages visibility of panels within KB View's custom sidebars.
 *
 * This is a greenfield implementation that works with SidebarWidget instances,
 * NOT Theia's LeftPanelHandler/RightPanelHandler.
 *
 * The service provides a simple API for Ribbon icons to show/hide panels
 * and tracks which panels are currently visible on each side.
 */
@injectable()
export class SidebarServiceImpl implements SidebarService {
    protected leftSidebar: SidebarWidget | undefined;
    protected rightSidebar: SidebarWidget | undefined;

    private readonly onVisibilityChangedEmitter = new Emitter<SidebarVisibilityChange>();
    readonly onVisibilityChanged = this.onVisibilityChangedEmitter.event;

    @postConstruct()
    protected init(): void {
        console.log('[SidebarService] Initialized');
    }

    /**
     * Register the sidebar widget instances.
     * Called by KBViewShell after creating the sidebars.
     */
    registerSidebars(left: SidebarWidget, right: SidebarWidget): void {
        this.leftSidebar = left;
        this.rightSidebar = right;

        // Forward visibility events from widgets
        left.onPanelVisibilityChanged(event => {
            this.onVisibilityChangedEmitter.fire({
                side: 'left',
                panelId: event.panelId,
                visible: event.visible,
            });
        });

        right.onPanelVisibilityChanged(event => {
            this.onVisibilityChangedEmitter.fire({
                side: 'right',
                panelId: event.panelId,
                visible: event.visible,
            });
        });

        console.log('[SidebarService] Registered custom sidebar widgets');
    }

    show(side: 'left' | 'right', panelId: string): void {
        const sidebar = this.getSidebar(side);
        if (!sidebar) {
            console.warn(`[SidebarService] Sidebar not registered for side: ${side}`);
            return;
        }

        sidebar.showPanel(panelId);
    }

    hide(side: 'left' | 'right', panelId: string): void {
        const sidebar = this.getSidebar(side);
        if (!sidebar) {
            console.warn(`[SidebarService] Sidebar not registered for side: ${side}`);
            return;
        }

        sidebar.hidePanel(panelId);
    }

    toggle(side: 'left' | 'right', panelId: string): void {
        const sidebar = this.getSidebar(side);
        if (!sidebar) {
            console.warn(`[SidebarService] Sidebar not registered for side: ${side}`);
            return;
        }

        sidebar.togglePanel(panelId);
    }

    isVisible(side: 'left' | 'right', panelId: string): boolean {
        const sidebar = this.getSidebar(side);
        if (!sidebar) {
            return false;
        }

        return sidebar.isPanelVisible(panelId);
    }

    protected getSidebar(side: 'left' | 'right'): SidebarWidget | undefined {
        return side === 'left' ? this.leftSidebar : this.rightSidebar;
    }
}
