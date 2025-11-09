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

/**
 * View Mode Manager - Controls switching between KB View and Developer View
 *
 * KB View: Knowledge-first interface with KB panels visible, dev tools hidden
 * Developer View: Full IDE with all developer tools visible
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ApplicationShell, WidgetManager } from '@theia/core/lib/browser';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import { Emitter, Event } from '@theia/core/lib/common/event';

export const VIEW_MODE_STORAGE_KEY = 'quallaa.view.mode';

export enum ViewMode {
    KnowledgeBase = 'kb',
    Developer = 'dev',
}

/**
 * Configuration defining which widgets are visible in each view mode
 */
export interface ViewModeConfig {
    /** Widgets to show in this mode */
    visibleWidgets: string[];
    /** Widgets to hide in this mode */
    hiddenWidgets: string[];
    /** Whether to show the bottom panel */
    showBottomPanel: boolean;
    /** Which side panel to prioritize (left/right) */
    primarySidePanel?: 'left' | 'right';
}

@injectable()
export class ViewModeManager {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(StorageService)
    protected readonly storageService: StorageService;

    private currentMode: ViewMode = ViewMode.KnowledgeBase;

    private readonly onDidChangeModeEmitter = new Emitter<ViewMode>();
    readonly onDidChangeMode: Event<ViewMode> = this.onDidChangeModeEmitter.event;

    /**
     * Knowledge Base View Configuration
     * Shows: KB features (backlinks, graph, tags, daily notes)
     * Hides: Developer tools (terminal, debug, SCM, problems, output)
     */
    private readonly kbViewConfig: ViewModeConfig = {
        visibleWidgets: [
            'backlinks',
            'knowledge-graph',
            'tags-browser',
            'explorer-view-container', // File explorer
            'outline-view',
            'search-view-container',
        ],
        hiddenWidgets: ['terminal', 'debug', 'scm-view-container', 'problems', 'output', 'timeline-view', 'test-view-container'],
        showBottomPanel: false,
        primarySidePanel: 'left',
    };

    /**
     * Developer View Configuration
     * Shows: All IDE features
     * Hides: Nothing (full IDE experience)
     */
    private readonly developerViewConfig: ViewModeConfig = {
        visibleWidgets: [
            'backlinks',
            'knowledge-graph',
            'tags-browser',
            'explorer-view-container',
            'scm-view-container',
            'debug',
            'outline-view',
            'search-view-container',
            'timeline-view',
            'test-view-container',
        ],
        hiddenWidgets: [],
        showBottomPanel: true,
        primarySidePanel: 'left',
    };

    @postConstruct()
    protected async init(): Promise<void> {
        // Load saved mode from storage
        const savedMode = await this.storageService.getData<string>(VIEW_MODE_STORAGE_KEY);
        if (savedMode === ViewMode.Developer || savedMode === ViewMode.KnowledgeBase) {
            this.currentMode = savedMode;
        }

        // Apply the current mode after a short delay to ensure all widgets are registered
        setTimeout(() => this.applyCurrentMode(), 2000);
    }

    /**
     * Get the current view mode
     */
    getMode(): ViewMode {
        return this.currentMode;
    }

    /**
     * Check if currently in KB View mode
     */
    isKBMode(): boolean {
        return this.currentMode === ViewMode.KnowledgeBase;
    }

    /**
     * Check if currently in Developer View mode
     */
    isDeveloperMode(): boolean {
        return this.currentMode === ViewMode.Developer;
    }

    /**
     * Switch to Knowledge Base View mode
     */
    async switchToKBMode(): Promise<void> {
        if (this.currentMode !== ViewMode.KnowledgeBase) {
            this.currentMode = ViewMode.KnowledgeBase;
            await this.applyViewMode(this.kbViewConfig);
            await this.storageService.setData(VIEW_MODE_STORAGE_KEY, ViewMode.KnowledgeBase);
            this.onDidChangeModeEmitter.fire(ViewMode.KnowledgeBase);
        }
    }

    /**
     * Switch to Developer View mode
     */
    async switchToDeveloperMode(): Promise<void> {
        if (this.currentMode !== ViewMode.Developer) {
            this.currentMode = ViewMode.Developer;
            await this.applyViewMode(this.developerViewConfig);
            await this.storageService.setData(VIEW_MODE_STORAGE_KEY, ViewMode.Developer);
            this.onDidChangeModeEmitter.fire(ViewMode.Developer);
        }
    }

    /**
     * Toggle between KB and Developer modes
     */
    async toggleMode(): Promise<void> {
        if (this.isKBMode()) {
            await this.switchToDeveloperMode();
        } else {
            await this.switchToKBMode();
        }
    }

    /**
     * Apply the current mode
     */
    private async applyCurrentMode(): Promise<void> {
        const config = this.isKBMode() ? this.kbViewConfig : this.developerViewConfig;
        await this.applyViewMode(config);
    }

    /**
     * Apply a view mode configuration
     */
    private async applyViewMode(config: ViewModeConfig): Promise<void> {
        // Close widgets that should be hidden
        for (const widgetId of config.hiddenWidgets) {
            try {
                const widget = this.widgetManager.tryGetWidget(widgetId);
                if (widget && widget.isVisible) {
                    await this.shell.closeWidget(widgetId);
                }
            } catch (error) {
                // Widget might not exist, continue
                console.debug(`Could not close widget ${widgetId}:`, error);
            }
        }

        // Show widgets that should be visible
        for (const widgetId of config.visibleWidgets) {
            try {
                // Only open if not already visible
                const widget = this.widgetManager.tryGetWidget(widgetId);
                if (!widget || !widget.isVisible) {
                    // Don't await here to avoid blocking on widget creation
                    this.shell.revealWidget(widgetId).catch(err => {
                        console.debug(`Could not reveal widget ${widgetId}:`, err);
                    });
                }
            } catch (error) {
                // Widget might not be registered yet, continue
                console.debug(`Could not open widget ${widgetId}:`, error);
            }
        }

        // Handle bottom panel visibility
        if (!config.showBottomPanel && this.shell.isExpanded('bottom')) {
            await this.shell.collapsePanel('bottom');
        }

        // Ensure primary side panel is expanded
        if (config.primarySidePanel) {
            if (!this.shell.isExpanded(config.primarySidePanel)) {
                await this.shell.expandPanel(config.primarySidePanel);
            }
        }
    }

    /**
     * Get a description of the current mode
     */
    getModeDescription(): string {
        return this.isKBMode() ? 'Knowledge Base View - Focus on notes, links, and knowledge management' : 'Developer View - Full IDE with all development tools';
    }
}
