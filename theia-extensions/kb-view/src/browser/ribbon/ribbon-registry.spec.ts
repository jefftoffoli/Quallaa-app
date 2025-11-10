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

/* eslint-disable @typescript-eslint/no-explicit-any, no-unused-expressions */
import { expect } from 'chai';
import { RibbonItemRegistryImpl } from './ribbon-registry';
import { RibbonItem } from '../../common/kb-view-protocol';

describe('RibbonItemRegistry', () => {
    let registry: RibbonItemRegistryImpl;

    beforeEach(() => {
        registry = new RibbonItemRegistryImpl();
        // Mock the contribution provider
        (registry as any).contributionProvider = {
            getContributions: () => [],
        };
        (registry as any).init();
    });

    describe('registerItem', () => {
        it('should register a ribbon item', () => {
            const item: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-test',
                tooltip: 'Test Item',
                side: 'left',
                panelId: 'test-panel',
                order: 10,
            };

            registry.registerItem(item);

            const items = registry.getItems();
            expect(items).to.have.length(1);
            expect(items[0]).to.deep.equal(item);
        });

        it('should overwrite existing item with same id', () => {
            const item1: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-old',
                tooltip: 'Old',
                side: 'left',
                panelId: 'old-panel',
                order: 10,
            };

            const item2: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-new',
                tooltip: 'New',
                side: 'right',
                panelId: 'new-panel',
                order: 20,
            };

            registry.registerItem(item1);
            registry.registerItem(item2);

            const items = registry.getItems();
            expect(items).to.have.length(1);
            expect(items[0].tooltip).to.equal('New');
            expect(items[0].side).to.equal('right');
        });

        it('should emit onDidChange event when item is registered', done => {
            const item: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-test',
                tooltip: 'Test',
                side: 'left',
                panelId: 'test-panel',
                order: 10,
            };

            registry.onDidChange(() => {
                done();
            });

            registry.registerItem(item);
        });
    });

    describe('unregisterItem', () => {
        it('should remove a registered item', () => {
            const item: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-test',
                tooltip: 'Test',
                side: 'left',
                panelId: 'test-panel',
                order: 10,
            };

            registry.registerItem(item);
            expect(registry.getItems()).to.have.length(1);

            registry.unregisterItem('test.item');
            expect(registry.getItems()).to.have.length(0);
        });

        it('should emit onDidChange event when item is unregistered', done => {
            const item: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-test',
                tooltip: 'Test',
                side: 'left',
                panelId: 'test-panel',
                order: 10,
            };

            registry.registerItem(item);

            registry.onDidChange(() => {
                if (registry.getItems().length === 0) {
                    done();
                }
            });

            registry.unregisterItem('test.item');
        });

        it('should not emit event if item does not exist', () => {
            let eventFired = false;
            registry.onDidChange(() => {
                eventFired = true;
            });

            registry.unregisterItem('non-existent');
            expect(eventFired).to.be.false;
        });
    });

    describe('getItems', () => {
        it('should return items sorted by order', () => {
            const item1: RibbonItem = {
                id: 'item.1',
                icon: 'codicon codicon-1',
                tooltip: 'Item 1',
                side: 'left',
                panelId: 'panel-1',
                order: 30,
            };

            const item2: RibbonItem = {
                id: 'item.2',
                icon: 'codicon codicon-2',
                tooltip: 'Item 2',
                side: 'left',
                panelId: 'panel-2',
                order: 10,
            };

            const item3: RibbonItem = {
                id: 'item.3',
                icon: 'codicon codicon-3',
                tooltip: 'Item 3',
                side: 'left',
                panelId: 'panel-3',
                order: 20,
            };

            registry.registerItem(item1);
            registry.registerItem(item2);
            registry.registerItem(item3);

            const items = registry.getItems();
            expect(items[0].id).to.equal('item.2');
            expect(items[1].id).to.equal('item.3');
            expect(items[2].id).to.equal('item.1');
        });

        it('should sort by id when order is equal', () => {
            const item1: RibbonItem = {
                id: 'zebra',
                icon: 'codicon codicon-z',
                tooltip: 'Z',
                side: 'left',
                panelId: 'panel-z',
                order: 10,
            };

            const item2: RibbonItem = {
                id: 'alpha',
                icon: 'codicon codicon-a',
                tooltip: 'A',
                side: 'left',
                panelId: 'panel-a',
                order: 10,
            };

            registry.registerItem(item1);
            registry.registerItem(item2);

            const items = registry.getItems();
            expect(items[0].id).to.equal('alpha');
            expect(items[1].id).to.equal('zebra');
        });
    });

    describe('getItem', () => {
        it('should return item by id', () => {
            const item: RibbonItem = {
                id: 'test.item',
                icon: 'codicon codicon-test',
                tooltip: 'Test',
                side: 'left',
                panelId: 'test-panel',
                order: 10,
            };

            registry.registerItem(item);

            const retrieved = registry.getItem('test.item');
            expect(retrieved).to.deep.equal(item);
        });

        it('should return undefined for non-existent id', () => {
            const item = registry.getItem('non-existent');
            expect(item).to.be.undefined;
        });
    });

    describe('getItemsBySide', () => {
        it('should filter items by left side', () => {
            const leftItem: RibbonItem = {
                id: 'left.item',
                icon: 'codicon codicon-left',
                tooltip: 'Left',
                side: 'left',
                panelId: 'left-panel',
                order: 10,
            };

            const rightItem: RibbonItem = {
                id: 'right.item',
                icon: 'codicon codicon-right',
                tooltip: 'Right',
                side: 'right',
                panelId: 'right-panel',
                order: 10,
            };

            registry.registerItem(leftItem);
            registry.registerItem(rightItem);

            const leftItems = (registry as any).getItemsBySide('left');
            expect(leftItems).to.have.length(1);
            expect(leftItems[0].id).to.equal('left.item');
        });

        it('should filter items by right side', () => {
            const leftItem: RibbonItem = {
                id: 'left.item',
                icon: 'codicon codicon-left',
                tooltip: 'Left',
                side: 'left',
                panelId: 'left-panel',
                order: 10,
            };

            const rightItem: RibbonItem = {
                id: 'right.item',
                icon: 'codicon codicon-right',
                tooltip: 'Right',
                side: 'right',
                panelId: 'right-panel',
                order: 10,
            };

            registry.registerItem(leftItem);
            registry.registerItem(rightItem);

            const rightItems = (registry as any).getItemsBySide('right');
            expect(rightItems).to.have.length(1);
            expect(rightItems[0].id).to.equal('right.item');
        });
    });

    describe('getItemsByGroup', () => {
        it('should filter items by top group', () => {
            const topItem: RibbonItem = {
                id: 'top.item',
                icon: 'codicon codicon-top',
                tooltip: 'Top',
                side: 'left',
                panelId: 'top-panel',
                order: 10,
                group: 'top',
            };

            const bottomItem: RibbonItem = {
                id: 'bottom.item',
                icon: 'codicon codicon-bottom',
                tooltip: 'Bottom',
                side: 'left',
                panelId: 'bottom-panel',
                order: 20,
                group: 'bottom',
            };

            registry.registerItem(topItem);
            registry.registerItem(bottomItem);

            const topItems = (registry as any).getItemsByGroup('top');
            expect(topItems).to.have.length(1);
            expect(topItems[0].id).to.equal('top.item');
        });

        it('should filter items by bottom group', () => {
            const topItem: RibbonItem = {
                id: 'top.item',
                icon: 'codicon codicon-top',
                tooltip: 'Top',
                side: 'left',
                panelId: 'top-panel',
                order: 10,
                group: 'top',
            };

            const bottomItem: RibbonItem = {
                id: 'bottom.item',
                icon: 'codicon codicon-bottom',
                tooltip: 'Bottom',
                side: 'left',
                panelId: 'bottom-panel',
                order: 20,
                group: 'bottom',
            };

            registry.registerItem(topItem);
            registry.registerItem(bottomItem);

            const bottomItems = (registry as any).getItemsByGroup('bottom');
            expect(bottomItems).to.have.length(1);
            expect(bottomItems[0].id).to.equal('bottom.item');
        });
    });
});
