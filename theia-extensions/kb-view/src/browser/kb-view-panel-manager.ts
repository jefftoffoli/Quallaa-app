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
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { KBViewShell } from './shell/kb-view-shell';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { SidebarWidget } from './sidebar/sidebar-widget';

/**
 * Panel IDs that match the ribbon item panel IDs.
 * These need to match what's registered in DefaultRibbonContribution.
 */
export const KB_VIEW_PANELS = {
    // Left sidebar - Knowledge features
    KNOWLEDGE_GRAPH: 'knowledge-graph-view',
    DAILY_NOTE: 'daily-note-view',

    // Right sidebar - Context
    BACKLINKS: 'backlinks-view-container',
    TAGS: 'tags-view-container',
};

/**
 * Knowledge Base widget IDs (from knowledge-base extension).
 * These are the actual widget implementation IDs.
 */
export const KB_WIDGET_IDS = {
    GRAPH: 'knowledge-base-graph-widget',
    BACKLINKS: 'knowledge-base-backlinks',
    TAGS: 'knowledge-base-tags-widget',
};

/**
 * Manages integration between KB View sidebars and knowledge base widgets.
 *
 * This service:
 * 1. Loads knowledge base widgets from the widget manager
 * 2. Registers them as panels in KB View sidebars
 * 3. Maps ribbon panel IDs to actual widget instances
 */
@injectable()
export class KBViewPanelManager {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    protected isInitialized = false;

    @postConstruct()
    protected init(): void {
        console.log('[KBViewPanelManager] Service initialized');
    }

    /**
     * Initialize panels in KB View sidebars.
     * Called by KBViewShell after sidebars are created.
     */
    async initializePanels(): Promise<void> {
        if (this.isInitialized) {
            console.log('[KBViewPanelManager] Already initialized');
            return;
        }

        if (!(this.shell instanceof KBViewShell)) {
            console.log('[KBViewPanelManager] Not in KB View mode, skipping panel initialization');
            return;
        }

        console.log('[KBViewPanelManager] Initializing panels for KB View');

        // Get sidebars from the shell
        const leftSidebar = this.shell.getSidebar('left');
        const rightSidebar = this.shell.getSidebar('right');

        if (!leftSidebar || !rightSidebar) {
            console.warn('[KBViewPanelManager] Sidebars not available');
            return;
        }

        // Register left sidebar panels (Knowledge features)
        await this.registerPanel(leftSidebar, KB_VIEW_PANELS.KNOWLEDGE_GRAPH, KB_WIDGET_IDS.GRAPH);

        // Register right sidebar panels (Context)
        await this.registerPanel(rightSidebar, KB_VIEW_PANELS.BACKLINKS, KB_WIDGET_IDS.BACKLINKS);
        await this.registerPanel(rightSidebar, KB_VIEW_PANELS.TAGS, KB_WIDGET_IDS.TAGS);

        this.isInitialized = true;
        console.log('[KBViewPanelManager] Panel initialization complete');
    }

    /**
     * Register a widget as a panel in a sidebar.
     *
     * @param sidebar The sidebar widget to add the panel to
     * @param panelId The panel ID used by the ribbon
     * @param widgetId The widget ID from the knowledge-base extension
     */
    protected async registerPanel(sidebar: SidebarWidget, panelId: string, widgetId: string): Promise<void> {
        try {
            // Get or create the widget
            const widget = (await this.widgetManager.getOrCreateWidget(widgetId)) as Widget;

            if (!widget) {
                console.warn(`[KBViewPanelManager] Could not create widget: ${widgetId}`);
                return;
            }

            // Register with sidebar using the ribbon's panel ID
            sidebar.addPanel(panelId, widget);
            console.log(`[KBViewPanelManager] Registered panel: ${panelId} (widget: ${widgetId})`);
        } catch (error) {
            console.error(`[KBViewPanelManager] Error registering panel ${panelId}:`, error);
        }
    }
}
