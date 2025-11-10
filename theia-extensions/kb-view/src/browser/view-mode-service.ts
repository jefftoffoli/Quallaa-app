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
     * CURRENT STATE: Just logs warning about reload requirement.
     *
     * TODO (Phase 8 - Shell Swapping):
     * Implement actual shell replacement using DOM manipulation:
     *
     * 1. Capture current state:
     *    - const layoutData = currentShell.getLayoutData()
     *    - Save open editors, panel visibility, etc.
     *
     * 2. Create new shell instance:
     *    - const newShell = container.get(newMode === 'kb-view' ? KBViewShell : ApplicationShell)
     *
     * 3. Replace in DOM:
     *    - const container = document.getElementById('theia-app-shell')
     *    - container.innerHTML = ''
     *    - newShell.attach(container)
     *
     * 4. Restore state:
     *    - await newShell.setLayoutData(layoutData)
     *
     * 5. Update current mode:
     *    - this.currentMode = newMode
     *
     * CHALLENGE: Preserving editor content and widget state across shell swap.
     * May need to serialize/deserialize widget state.
     */
    protected switchMode(newMode: ViewMode): void {
        this.currentMode = newMode;

        // Notify user that reload is required
        console.warn('[ViewModeService] View mode changed. Application reload required to apply changes.');

        // TODO: Show notification dialog offering to reload
        // For now, mode switching requires manual page reload
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
