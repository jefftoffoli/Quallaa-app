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
import { BaseWidget, Widget, PanelLayout, BoxPanel } from '@theia/core/lib/browser';
import { Emitter } from '@theia/core/lib/common/event';

/**
 * Custom sidebar widget for KB View.
 * This is a completely greenfield component that manages panels independently
 * of Theia's LeftPanelHandler/RightPanelHandler system.
 *
 * Unlike Theia's Activity Bar (single-document mode), this sidebar supports
 * multiple panels being visible simultaneously with tabs to switch between them.
 */
@injectable()
export class SidebarWidget extends BaseWidget {
    static readonly ID_LEFT = 'kb-sidebar-left';
    static readonly ID_RIGHT = 'kb-sidebar-right';

    protected panels = new Map<string, Widget>();
    protected visiblePanels = new Set<string>();
    protected containerPanel: BoxPanel;

    protected readonly onPanelVisibilityChangedEmitter = new Emitter<{ panelId: string; visible: boolean }>();
    readonly onPanelVisibilityChanged = this.onPanelVisibilityChangedEmitter.event;

    constructor(protected readonly side: 'left' | 'right') {
        super();
        this.id = side === 'left' ? SidebarWidget.ID_LEFT : SidebarWidget.ID_RIGHT;
        this.title.label = side === 'left' ? 'Left Sidebar' : 'Right Sidebar';
        this.title.closable = false;

        this.addClass('kb-sidebar');
        this.addClass(`kb-sidebar-${side}`);

        // Create container for panels
        this.containerPanel = new BoxPanel({ direction: 'top-to-bottom' });
        this.containerPanel.addClass('kb-sidebar-container');
    }

    @postConstruct()
    protected init(): void {
        // Set up layout
        const layout = new PanelLayout();
        this.layout = layout;
        layout.addWidget(this.containerPanel);
    }

    /**
     * Register a panel widget that can be shown in this sidebar.
     */
    addPanel(id: string, widget: Widget): void {
        if (this.panels.has(id)) {
            console.warn(`[SidebarWidget] Panel ${id} already registered`);
            return;
        }

        this.panels.set(id, widget);
        console.log(`[SidebarWidget] Registered panel: ${id} in ${this.side} sidebar`);
    }

    /**
     * Remove a panel from this sidebar.
     */
    removePanel(id: string): void {
        const widget = this.panels.get(id);
        if (!widget) {
            return;
        }

        this.hidePanel(id);
        this.panels.delete(id);
        console.log(`[SidebarWidget] Removed panel: ${id} from ${this.side} sidebar`);
    }

    /**
     * Show a specific panel.
     * In KB View, multiple panels can be visible simultaneously.
     */
    showPanel(id: string): void {
        const widget = this.panels.get(id);
        if (!widget) {
            console.warn(`[SidebarWidget] Panel ${id} not found`);
            return;
        }

        if (this.visiblePanels.has(id)) {
            // Already visible
            return;
        }

        // Add to container and track visibility
        this.containerPanel.addWidget(widget);
        this.visiblePanels.add(id);

        console.log(`[SidebarWidget] Showed panel: ${id} in ${this.side} sidebar`);
        this.onPanelVisibilityChangedEmitter.fire({ panelId: id, visible: true });
    }

    /**
     * Hide a specific panel.
     */
    hidePanel(id: string): void {
        const widget = this.panels.get(id);
        if (!widget) {
            return;
        }

        if (!this.visiblePanels.has(id)) {
            // Already hidden
            return;
        }

        // Remove from container
        widget.parent = undefined;
        this.visiblePanels.delete(id);

        console.log(`[SidebarWidget] Hid panel: ${id} in ${this.side} sidebar`);
        this.onPanelVisibilityChangedEmitter.fire({ panelId: id, visible: false });
    }

    /**
     * Toggle panel visibility.
     */
    togglePanel(id: string): void {
        if (this.isPanelVisible(id)) {
            this.hidePanel(id);
        } else {
            this.showPanel(id);
        }
    }

    /**
     * Check if a panel is currently visible.
     */
    isPanelVisible(id: string): boolean {
        return this.visiblePanels.has(id);
    }

    /**
     * Get all visible panel IDs.
     */
    getVisiblePanels(): string[] {
        return Array.from(this.visiblePanels);
    }

    /**
     * Collapse the entire sidebar (hide all panels).
     */
    collapse(): void {
        const panelsToHide = Array.from(this.visiblePanels);
        panelsToHide.forEach(id => this.hidePanel(id));
    }

    /**
     * Expand the sidebar (show previously visible panels or default).
     */
    expand(defaultPanelId?: string): void {
        if (this.visiblePanels.size === 0 && defaultPanelId) {
            this.showPanel(defaultPanelId);
        }
    }

    override dispose(): void {
        this.panels.clear();
        this.visiblePanels.clear();
        super.dispose();
    }
}
