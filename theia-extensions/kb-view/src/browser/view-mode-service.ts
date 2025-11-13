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

import { injectable, inject, postConstruct, interfaces } from '@theia/core/shared/inversify';
import { PreferenceService, PreferenceChange } from '@theia/core/lib/common/preferences/preference-service';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { MessageService } from '@theia/core/lib/common/message-service';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { KBViewShell } from './shell/kb-view-shell';
import { KB_VIEW_MODE_PREFERENCE } from './kb-view-preferences';

export type ViewMode = 'kb-view' | 'developer';

/**
 * Service that manages switching between KB View and Developer View modes.
 * Dynamically rebinds ApplicationShell based on user preference.
 */
@injectable()
export class ViewModeService {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    protected currentMode: ViewMode = 'developer';

    @postConstruct()
    protected init(): void {
        // Read initial preference
        const initialMode = this.preferenceService.get<ViewMode>(KB_VIEW_MODE_PREFERENCE, 'developer');
        this.currentMode = initialMode;

        console.log(`[ViewModeService] Initialized with mode: ${this.currentMode}`);

        // Watch for preference changes
        this.preferenceService.onPreferenceChanged((event: PreferenceChange) => {
            if (event.preferenceName === KB_VIEW_MODE_PREFERENCE) {
                const newMode = event.newValue as ViewMode;
                if (newMode !== this.currentMode) {
                    console.log(`[ViewModeService] Mode changed: ${this.currentMode} -> ${newMode}`);
                    this.switchMode(newMode);
                }
            }
        });
    }

    /**
     * Get the current view mode
     */
    getCurrentMode(): ViewMode {
        return this.currentMode;
    }

    /**
     * Switch to a new view mode.
     *
     * IMPLEMENTATION: Reload-based approach (Phase 8.6)
     *
     * Shows a confirmation dialog to the user and reloads the window
     * if confirmed. The new mode preference is already saved, so the
     * reload will use the new shell.
     *
     * ALTERNATIVE APPROACH (not implemented):
     * Runtime shell swapping would require complex DOM manipulation
     * and state preservation. Decided reload is simpler and acceptable
     * for MVP since mode switching is infrequent.
     */
    protected async switchMode(newMode: ViewMode): Promise<void> {
        this.currentMode = newMode;

        const modeLabel = newMode === 'kb-view' ? 'KB View' : 'Developer View';

        console.log(`[ViewModeService] Switching to ${modeLabel} mode`);

        // Show confirmation dialog
        const shouldReload = await this.messageService.info(`Switching to ${modeLabel} mode requires reloading the window. Reload now?`, 'Reload Now', 'Later');

        if (shouldReload === 'Reload Now') {
            console.log('[ViewModeService] Reloading window to apply new mode');
            this.windowService.reload();
        } else {
            console.log('[ViewModeService] User chose to reload later. New mode will apply on next reload.');
        }
    }

    /**
     * Helper method to determine which shell class to bind at startup.
     * Called from frontend module during container configuration.
     */
    static getShellClass(preferenceService: PreferenceService): interfaces.Newable<ApplicationShell> {
        const mode = preferenceService.get<ViewMode>(KB_VIEW_MODE_PREFERENCE, 'developer');

        if (mode === 'kb-view') {
            console.log('[ViewModeService] Using KBViewShell');
            return KBViewShell as interfaces.Newable<ApplicationShell>;
        } else {
            console.log('[ViewModeService] Using standard ApplicationShell');
            return ApplicationShell;
        }
    }
}
