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

import { injectable } from '@theia/core/shared/inversify';
import { RibbonContribution, RibbonItemRegistry } from '../../common/kb-view-protocol';

/**
 * Provides default ribbon items for Quallaa's knowledge base features
 */
@injectable()
export class DefaultRibbonContribution implements RibbonContribution {
    registerRibbonItems(registry: RibbonItemRegistry): void {
        // Left sidebar - File management (top group)
        registry.registerItem({
            id: 'ribbon.files',
            icon: 'codicon codicon-files',
            tooltip: 'File Explorer',
            side: 'left',
            panelId: 'explorer-view-container',
            order: 10,
            group: 'top',
        });

        registry.registerItem({
            id: 'ribbon.search',
            icon: 'codicon codicon-search',
            tooltip: 'Search',
            side: 'left',
            panelId: 'search-view-container',
            order: 20,
            group: 'top',
        });

        // Left sidebar - Knowledge features (bottom group)
        registry.registerItem({
            id: 'ribbon.graph',
            icon: 'codicon codicon-graph',
            tooltip: 'Knowledge Graph',
            side: 'left',
            panelId: 'knowledge-graph-view',
            order: 100,
            group: 'bottom',
        });

        registry.registerItem({
            id: 'ribbon.daily-note',
            icon: 'codicon codicon-calendar',
            tooltip: 'Daily Note',
            side: 'left',
            panelId: 'daily-note-view',
            order: 110,
            group: 'bottom',
        });

        // Right sidebar - Context and references
        registry.registerItem({
            id: 'ribbon.backlinks',
            icon: 'codicon codicon-references',
            tooltip: 'Backlinks',
            side: 'right',
            panelId: 'backlinks-view-container',
            order: 10,
            group: 'top',
        });

        registry.registerItem({
            id: 'ribbon.tags',
            icon: 'codicon codicon-tag',
            tooltip: 'Tags',
            side: 'right',
            panelId: 'tags-view-container',
            order: 20,
            group: 'top',
        });

        registry.registerItem({
            id: 'ribbon.outline',
            icon: 'codicon codicon-list-tree',
            tooltip: 'Outline',
            side: 'right',
            panelId: 'outline-view',
            order: 30,
            group: 'top',
        });
    }
}
