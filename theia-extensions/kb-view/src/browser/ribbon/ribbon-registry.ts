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

import { injectable, inject, named, postConstruct } from '@theia/core/shared/inversify';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { Emitter } from '@theia/core/lib/common/event';
import { RibbonItem, RibbonItemRegistry, RibbonContribution } from '../../common/kb-view-protocol';

@injectable()
export class RibbonItemRegistryImpl implements RibbonItemRegistry {
    @inject(ContributionProvider)
    @named(RibbonContribution)
    protected readonly contributionProvider: ContributionProvider<RibbonContribution>;

    private items = new Map<string, RibbonItem>();
    private readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange = this.onDidChangeEmitter.event;

    @postConstruct()
    protected init(): void {
        // Collect items from all contributors
        for (const contribution of this.contributionProvider.getContributions()) {
            contribution.registerRibbonItems(this);
        }
    }

    registerItem(item: RibbonItem): void {
        if (this.items.has(item.id)) {
            console.warn(`[RibbonItemRegistry] Item with id '${item.id}' is already registered. Overwriting.`);
        }

        this.items.set(item.id, item);
        this.onDidChangeEmitter.fire();
    }

    unregisterItem(id: string): void {
        if (this.items.delete(id)) {
            this.onDidChangeEmitter.fire();
        }
    }

    getItems(): RibbonItem[] {
        // Return sorted by order, then by id
        return Array.from(this.items.values()).sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.id.localeCompare(b.id);
        });
    }

    getItem(id: string): RibbonItem | undefined {
        return this.items.get(id);
    }

    getItemsBySide(side: 'left' | 'right'): RibbonItem[] {
        return this.getItems().filter(item => item.side === side);
    }

    getItemsByGroup(group: 'top' | 'bottom'): RibbonItem[] {
        return this.getItems().filter(item => item.group === group);
    }
}
