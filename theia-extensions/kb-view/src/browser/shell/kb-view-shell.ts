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
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { Widget, BoxLayout, SplitPanel } from '@theia/core/shared/@lumino/widgets';

/**
 * Custom shell for KB View with Obsidian-inspired layout:
 * - Ribbon widgets (left and right) instead of Activity Bar
 * - Dual sidebars (both visible simultaneously)
 * - No bottom panel region
 * - Main editor area in center
 */
@injectable()
export class KBViewShell extends ApplicationShell {
    @postConstruct()
    protected override init(): void {
        super.init();
        this.addClass('kb-view-shell');
        console.log('[KBViewShell] Initialized KB View shell');
    }

    /**
     * Create custom layout: [Ribbon | Left Sidebar | Main | Right Sidebar | Ribbon]
     * No bottom panel region.
     */
    protected override createLayout(): BoxLayout {
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
     * Override to prevent bottom panel from being used
     */
    override async addWidget(widget: Widget, options?: ApplicationShell.WidgetOptions): Promise<void> {
        // If someone tries to add to bottom panel, redirect to main area
        if (options?.area === 'bottom') {
            console.warn('[KBViewShell] Bottom panel not available in KB View, redirecting to main area');
            return super.addWidget(widget, { ...options, area: 'main' });
        }

        return super.addWidget(widget, options);
    }
}
