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
import { Widget, BoxLayout, SplitPanel, Layout } from '@theia/core/shared/@lumino/widgets';
import { KB_VIEW_MODE_PREFERENCE } from '../kb-view-preferences';
import { ViewMode } from '../view-mode-service';

/**
 * Mode-aware shell that adapts based on view mode preference:
 * - KB View mode: Obsidian-inspired layout (dual sidebars, no bottom panel)
 * - Developer mode: Standard Theia IDE layout
 */
@injectable()
export class KBViewShell extends ApplicationShell {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected viewMode: ViewMode = 'developer';

    @postConstruct()
    protected override init(): void {
        // Read view mode preference
        // NOTE: PreferenceService may not be fully initialized yet, so it may return the default value
        this.viewMode = this.preferenceService.get<ViewMode>(KB_VIEW_MODE_PREFERENCE, 'kb-view');
        console.log(`[KBViewShell] Initializing with mode: ${this.viewMode}`);

        super.init();
        this.addClass('kb-view-shell');

        if (this.viewMode === 'kb-view') {
            this.addClass('kb-view-mode');
        }
    }

    /**
     * Create layout based on view mode:
     * - KB View mode: Custom layout with dual sidebars, no bottom panel
     * - Developer mode: Standard Theia IDE layout
     */
    protected override createLayout(): Layout {
        if (this.viewMode === 'kb-view') {
            return this.createKBViewLayout();
        } else {
            console.log('[KBViewShell] Using standard layout (developer mode)');
            return super.createLayout();
        }
    }

    /**
     * Create custom KB View layout: [Ribbon | Left Sidebar | Main | Right Sidebar | Ribbon]
     * No bottom panel region.
     */
    protected createKBViewLayout(): BoxLayout {
        console.log('[KBViewShell] Creating custom KB View layout');

        // Create horizontal split: Left Panel | Main | Right Panel
        const centerSplit = new SplitPanel({
            orientation: 'horizontal',
            spacing: 0,
        });

        // Add panel widgets (ribbons will be added later via addWidget)
        centerSplit.addWidget(this.leftPanelHandler.container);
        centerSplit.addWidget(this.mainPanel);
        centerSplit.addWidget(this.rightPanelHandler.container);

        // Set stretch factors: panels flexible (1), main most flexible (3)
        centerSplit.setRelativeSizes([1, 3, 1]);

        // Create main vertical layout: Top Panel | Center Split | Status Bar
        // Note: No bottom panel!
        const layout = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 });
        layout.addWidget(this.topPanel);
        BoxLayout.setStretch(this.topPanel, 0);

        layout.addWidget(centerSplit);
        BoxLayout.setStretch(centerSplit, 1);

        layout.addWidget(this.statusBar);
        BoxLayout.setStretch(this.statusBar, 0);

        console.log('[KBViewShell] KB View layout created');
        return layout;
    }

    /**
     * Override to prevent bottom panel from being used in KB View mode
     */
    override async addWidget(widget: Widget, options?: ApplicationShell.WidgetOptions): Promise<void> {
        // In KB View mode, redirect bottom panel widgets to main area
        if (this.viewMode === 'kb-view' && options?.area === 'bottom') {
            console.warn('[KBViewShell] Bottom panel not available in KB View mode, redirecting to main area');
            return super.addWidget(widget, { ...options, area: 'main' });
        }

        return super.addWidget(widget, options);
    }
}
