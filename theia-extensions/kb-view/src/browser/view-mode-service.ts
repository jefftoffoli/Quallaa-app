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
import { PreferenceService, PreferenceChange, PreferenceScope } from '@theia/core/lib/common/preferences';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { ModeStateManager } from './mode-state-manager';

export type ViewMode = 'kb-view' | 'developer';

export const ViewModeService = Symbol('ViewModeService');

export interface ViewModeService {
    readonly currentMode: ViewMode;
    readonly onDidChangeMode: Event<ViewMode>;
    initialize(): Promise<void>;
    switchMode(mode: ViewMode): Promise<void>;
    toggleMode(): Promise<void>;
}

@injectable()
export class ViewModeServiceImpl implements ViewModeService {
    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    @inject(ModeStateManager)
    protected readonly stateManager: ModeStateManager;

    private _currentMode: ViewMode = 'developer';

    private readonly onDidChangeModeEmitter = new Emitter<ViewMode>();
    readonly onDidChangeMode: Event<ViewMode> = this.onDidChangeModeEmitter.event;

    private readonly KB_VIEW_CONTEXT_KEY = 'kbViewMode';

    async initialize(): Promise<void> {
        // Read initial mode from preferences
        const savedMode = this.preferences.get<ViewMode>('kbView.mode', 'developer');
        this._currentMode = savedMode;

        // Apply initial CSS class
        this.applyCSSClass(this._currentMode);

        // Set context key for when expressions
        this.contextKeyService.createKey(this.KB_VIEW_CONTEXT_KEY, this._currentMode === 'kb-view');

        // Listen for preference changes (e.g., from settings UI)
        this.preferences.onPreferenceChanged((event: PreferenceChange) => {
            if (event.preferenceName === 'kbView.mode') {
                const newMode = event.newValue as ViewMode;
                if (newMode !== this._currentMode) {
                    this.switchMode(newMode);
                }
            }
        });
    }

    get currentMode(): ViewMode {
        return this._currentMode;
    }

    async switchMode(mode: ViewMode): Promise<void> {
        if (this._currentMode === mode) {
            return; // Already in this mode
        }

        const previousMode = this._currentMode;

        // Step 1: Capture current state before switching
        const currentState = await this.stateManager.captureState(previousMode);
        await this.stateManager.saveState(previousMode, currentState);

        // Step 2: Update mode
        this._currentMode = mode;

        // Update preference at User scope (persists across sessions)
        await this.preferences.set('kbView.mode', mode, PreferenceScope.User);

        // Update CSS classes
        this.applyCSSClass(mode);
        this.removeCSSClass(previousMode);

        // Update context key
        this.contextKeyService.setContext(this.KB_VIEW_CONTEXT_KEY, mode === 'kb-view');

        // Step 3: Load and restore state for new mode
        let savedState = await this.stateManager.loadState(mode);

        // If no saved state exists and switching to KB View, use default
        if (!savedState && mode === 'kb-view') {
            savedState = this.stateManager.getDefaultKBViewState();
        }

        // Restore state if available
        if (savedState) {
            await this.stateManager.restoreState(savedState);
        }

        // Notify listeners (after state restoration is complete)
        this.onDidChangeModeEmitter.fire(mode);
    }

    async toggleMode(): Promise<void> {
        const newMode: ViewMode = this._currentMode === 'kb-view' ? 'developer' : 'kb-view';
        await this.switchMode(newMode);
    }

    private applyCSSClass(mode: ViewMode): void {
        const className = mode === 'kb-view' ? 'kb-view-mode' : 'developer-mode';
        document.body.classList.add(className);
    }

    private removeCSSClass(mode: ViewMode): void {
        const className = mode === 'kb-view' ? 'kb-view-mode' : 'developer-mode';
        document.body.classList.remove(className);
    }
}
