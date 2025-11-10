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
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { PreferenceService } from '@theia/core/lib/common/preferences/preference-service';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { Widget, BoxLayout, SplitPanel, Layout } from '@theia/core/shared/@lumino/widgets';
import { KB_VIEW_MODE_PREFERENCE } from '../kb-view-preferences';
import { ViewMode } from '../view-mode-service';
import { RibbonWidget } from '../ribbon/ribbon-widget';
import { SidebarWidget } from '../sidebar/sidebar-widget';
import { SidebarServiceImpl } from '../sidebar/sidebar-service';

/**
 * Custom shell for KB View with Obsidian-inspired layout.
 *
 * GREENFIELD APPROACH: This shell creates completely custom sidebar widgets
 * instead of reusing Theia's LeftPanelHandler/RightPanelHandler.
 *
 * Layout structure:
 * [Ribbon | Custom Left Sidebar | Main Area | Custom Right Sidebar]
 *
 * Key differences from standard Theia:
 * - Custom Ribbon widget replaces Activity Bar
 * - Custom SidebarWidget instances (not panel handlers)
 * - No bottom panel region
 * - Dual sidebars can be visible simultaneously
 */
@injectable()
export class KBViewShell extends ApplicationShell {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(SidebarServiceImpl)
    protected readonly sidebarService: SidebarServiceImpl;

    protected viewMode: ViewMode = 'developer';
    protected ribbonWidget: RibbonWidget | undefined;
    protected leftSidebar: SidebarWidget | undefined;
    protected rightSidebar: SidebarWidget | undefined;

    @postConstruct()
    protected override init(): void {
        // Read view mode preference
        this.viewMode = this.preferenceService.get<ViewMode>(KB_VIEW_MODE_PREFERENCE, 'kb-view');
        console.log(`[KBViewShell] Initializing with mode: ${this.viewMode}`);

        super.init();
        this.addClass('kb-view-shell');

        if (this.viewMode === 'kb-view') {
            this.addClass('kb-view-mode');
            this.initializeKBViewComponents();
        }
    }

    /**
     * Initialize KB View specific components asynchronously.
     */
    protected async initializeKBViewComponents(): Promise<void> {
        try {
            // Create ribbon widget
            this.ribbonWidget = await this.widgetManager.getOrCreateWidget<RibbonWidget>(RibbonWidget.ID);
            this.ribbonWidget.setSide('left');
            console.log('[KBViewShell] Ribbon widget created');

            // Ribbon will be added to layout when shell is fully initialized
            // We can't modify layout during @postConstruct, so we'll add it afterward
        } catch (error) {
            console.error('[KBViewShell] Failed to initialize KB View components:', error);
        }
    }

    /**
     * Create layout based on view mode.
     */
    protected override createLayout(): Layout {
        if (this.viewMode === 'kb-view') {
            return this.createKBViewLayout();
        } else {
            console.log('[KBViewShell] Using standard Theia layout (developer mode)');
            return super.createLayout();
        }
    }

    /**
     * Create greenfield KB View layout with custom sidebars.
     *
     * Structure:
     * Horizontal: [Ribbon | Left Sidebar | Main Area | Right Sidebar]
     * Main Area Vertical: [Top Panel | Main Panel | Status Bar]
     *
     * NO bottom panel region - terminal/problems/output don't exist in KB View.
     */
    protected createKBViewLayout(): BoxLayout {
        console.log('[KBViewShell] Creating greenfield KB View layout');

        // Create custom sidebar widgets
        this.leftSidebar = new SidebarWidget('left');
        this.rightSidebar = new SidebarWidget('right');

        // Register sidebars with service
        this.sidebarService.registerSidebars(this.leftSidebar, this.rightSidebar);

        // Create main area layout (vertical: top panel, main, status bar)
        const mainAreaLayout = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 });
        const mainAreaWidget = new Widget();
        mainAreaWidget.layout = mainAreaLayout;

        // Top panel (menu bar, toolbar)
        mainAreaLayout.addWidget(this.topPanel);
        BoxLayout.setStretch(this.topPanel, 0);

        // Main panel (editor area)
        mainAreaLayout.addWidget(this.mainPanel);
        BoxLayout.setStretch(this.mainPanel, 1);

        // Status bar
        mainAreaLayout.addWidget(this.statusBar);
        BoxLayout.setStretch(this.statusBar, 0);

        // Create horizontal split with sidebars
        const horizontalSplit = new SplitPanel({
            orientation: 'horizontal',
            spacing: 0,
        });

        // Add widgets: Left Sidebar | Main Area | Right Sidebar
        // Note: Ribbon will be inserted at position 0 later
        horizontalSplit.addWidget(this.leftSidebar);
        horizontalSplit.addWidget(mainAreaWidget);
        horizontalSplit.addWidget(this.rightSidebar);

        // Set relative sizes: left sidebar (1), main (3), right sidebar (1)
        // Will become [ribbon (0.5), left (1), main (3), right (1)] when ribbon added
        horizontalSplit.setRelativeSizes([1, 3, 1]);

        // Create root layout
        const rootLayout = new BoxLayout({ direction: 'left-to-right', spacing: 0 });
        rootLayout.addWidget(horizontalSplit);
        BoxLayout.setStretch(horizontalSplit, 1);

        console.log('[KBViewShell] Greenfield KB View layout created with custom sidebars');
        return rootLayout;
    }

    /**
     * Override addWidget to prevent bottom panel usage in KB View mode.
     */
    override async addWidget(widget: Widget, options?: ApplicationShell.WidgetOptions): Promise<void> {
        if (this.viewMode === 'kb-view' && options?.area === 'bottom') {
            console.warn('[KBViewShell] Bottom panel not available in KB View mode, redirecting to main area');
            return super.addWidget(widget, { ...options, area: 'main' });
        }

        return super.addWidget(widget, options);
    }

    /**
     * Get custom sidebar widget (for adding panels to sidebars).
     */
    getSidebar(side: 'left' | 'right'): SidebarWidget | undefined {
        return side === 'left' ? this.leftSidebar : this.rightSidebar;
    }

    /**
     * Get ribbon widget (for customization).
     */
    getRibbon(): RibbonWidget | undefined {
        return this.ribbonWidget;
    }
}
