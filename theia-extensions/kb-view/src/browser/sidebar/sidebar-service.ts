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

import { injectable, inject } from '@theia/core/shared/inversify';
import { ApplicationShell, SidePanelHandler } from '@theia/core/lib/browser/shell';
import { Emitter } from '@theia/core/lib/common/event';
import { SidebarService, SidebarVisibilityChange } from '../../common/kb-view-protocol';

@injectable()
export class SidebarServiceImpl implements SidebarService {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    private visiblePanels = new Map<string, Set<string>>();
    private readonly onVisibilityChangedEmitter = new Emitter<SidebarVisibilityChange>();
    readonly onVisibilityChanged = this.onVisibilityChangedEmitter.event;

    show(side: 'left' | 'right', panelId: string): void {
        const handler = this.getHandler(side);
        if (!handler) {
            console.warn(`[SidebarService] No handler for side: ${side}`);
            return;
        }

        // Activate the widget in the panel
        handler.activate(panelId);

        // Track visible panels
        this.trackVisibility(side, panelId, true);

        // Emit event
        this.onVisibilityChangedEmitter.fire({ side, panelId, visible: true });
    }

    hide(side: 'left' | 'right', panelId: string): void {
        const handler = this.getHandler(side);
        if (!handler) {
            console.warn(`[SidebarService] No handler for side: ${side}`);
            return;
        }

        // Collapse the panel (this hides all widgets in it)
        handler.collapse();

        // Track visibility
        this.trackVisibility(side, panelId, false);

        // Emit event
        this.onVisibilityChangedEmitter.fire({ side, panelId, visible: false });
    }

    toggle(side: 'left' | 'right', panelId: string): void {
        if (this.isVisible(side, panelId)) {
            this.hide(side, panelId);
        } else {
            this.show(side, panelId);
        }
    }

    isVisible(side: 'left' | 'right', panelId: string): boolean {
        const panels = this.visiblePanels.get(side);
        return panels ? panels.has(panelId) : false;
    }

    protected getHandler(side: 'left' | 'right'): SidePanelHandler {
        return side === 'left' ? this.shell.leftPanelHandler : this.shell.rightPanelHandler;
    }

    protected trackVisibility(side: 'left' | 'right', panelId: string, visible: boolean): void {
        if (!this.visiblePanels.has(side)) {
            this.visiblePanels.set(side, new Set());
        }

        const panels = this.visiblePanels.get(side)!;
        if (visible) {
            panels.add(panelId);
        } else {
            panels.delete(panelId);
        }
    }
}
