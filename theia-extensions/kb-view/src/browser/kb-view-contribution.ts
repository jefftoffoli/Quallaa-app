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
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { KBViewShell } from './shell/kb-view-shell';
import { KBViewPanelManager } from './kb-view-panel-manager';

/**
 * Frontend contribution that initializes KB View panels after the application starts.
 *
 * This follows Theia's pattern: WidgetManager should never be called in @postConstruct.
 * Instead, widget creation happens in lifecycle hooks (onStart, onReady) after DI is complete.
 */
@injectable()
export class KBViewContribution implements FrontendApplicationContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(KBViewPanelManager)
    protected readonly panelManager: KBViewPanelManager;

    /**
     * Called after the frontend application has started.
     * This is the correct place to call WidgetManager.getOrCreateWidget().
     */
    async onStart(app: FrontendApplication): Promise<void> {
        // Only initialize panels if we're in KB View mode
        if (this.shell instanceof KBViewShell) {
            console.log('[KBViewContribution] Initializing panels after application start');
            try {
                await this.panelManager.initializePanels();
            } catch (error) {
                console.error('[KBViewContribution] Failed to initialize panels:', error);
            }
        }
    }
}
