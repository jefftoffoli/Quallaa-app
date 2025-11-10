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
import { DefaultRibbonContribution } from './default-ribbon-contribution';
import { RibbonItem, RibbonItemRegistry } from '../../common/kb-view-protocol';

describe('DefaultRibbonContribution', () => {
    let contribution: DefaultRibbonContribution;
    let registeredItems: RibbonItem[];

    beforeEach(() => {
        contribution = new DefaultRibbonContribution();
        registeredItems = [];
    });

    const mockRegistry: RibbonItemRegistry = {
        registerItem: (item: RibbonItem) => {
            registeredItems.push(item);
        },
        unregisterItem: (id: string) => {
            const index = registeredItems.findIndex(item => item.id === id);
            if (index !== -1) {
                registeredItems.splice(index, 1);
            }
        },
        getItems: () => registeredItems,
        getItem: (id: string) => registeredItems.find(item => item.id === id),
        onDidChange: undefined as any,
    };

    describe('registerRibbonItems', () => {
        it('should register all default ribbon items', () => {
            contribution.registerRibbonItems(mockRegistry);

            // Should register 7 items total
            expect(registeredItems).to.have.length(7);
        });

        it('should register left sidebar items', () => {
            contribution.registerRibbonItems(mockRegistry);

            const leftItems = registeredItems.filter(item => item.side === 'left');
            expect(leftItems).to.have.length(4);

            // Check specific items
            const filesItem = leftItems.find(item => item.id === 'ribbon.files');
            expect(filesItem).to.exist;
            expect(filesItem?.tooltip).to.equal('File Explorer');
            expect(filesItem?.panelId).to.equal('explorer-view-container');

            const searchItem = leftItems.find(item => item.id === 'ribbon.search');
            expect(searchItem).to.exist;
            expect(searchItem?.tooltip).to.equal('Search');

            const graphItem = leftItems.find(item => item.id === 'ribbon.graph');
            expect(graphItem).to.exist;
            expect(graphItem?.tooltip).to.equal('Knowledge Graph');

            const dailyNoteItem = leftItems.find(item => item.id === 'ribbon.daily-note');
            expect(dailyNoteItem).to.exist;
            expect(dailyNoteItem?.tooltip).to.equal('Daily Note');
        });

        it('should register right sidebar items', () => {
            contribution.registerRibbonItems(mockRegistry);

            const rightItems = registeredItems.filter(item => item.side === 'right');
            expect(rightItems).to.have.length(3);

            // Check specific items
            const backlinksItem = rightItems.find(item => item.id === 'ribbon.backlinks');
            expect(backlinksItem).to.exist;
            expect(backlinksItem?.tooltip).to.equal('Backlinks');

            const tagsItem = rightItems.find(item => item.id === 'ribbon.tags');
            expect(tagsItem).to.exist;
            expect(tagsItem?.tooltip).to.equal('Tags');

            const outlineItem = rightItems.find(item => item.id === 'ribbon.outline');
            expect(outlineItem).to.exist;
            expect(outlineItem?.tooltip).to.equal('Outline');
        });

        it('should assign proper groups to items', () => {
            contribution.registerRibbonItems(mockRegistry);

            // Files and Search should be in top group
            const filesItem = registeredItems.find(item => item.id === 'ribbon.files');
            expect(filesItem?.group).to.equal('top');

            const searchItem = registeredItems.find(item => item.id === 'ribbon.search');
            expect(searchItem?.group).to.equal('top');

            // Knowledge features should be in bottom group
            const graphItem = registeredItems.find(item => item.id === 'ribbon.graph');
            expect(graphItem?.group).to.equal('bottom');

            const dailyNoteItem = registeredItems.find(item => item.id === 'ribbon.daily-note');
            expect(dailyNoteItem?.group).to.equal('bottom');

            // Right sidebar items should be in top group
            const backlinksItem = registeredItems.find(item => item.id === 'ribbon.backlinks');
            expect(backlinksItem?.group).to.equal('top');

            const tagsItem = registeredItems.find(item => item.id === 'ribbon.tags');
            expect(tagsItem?.group).to.equal('top');

            const outlineItem = registeredItems.find(item => item.id === 'ribbon.outline');
            expect(outlineItem?.group).to.equal('top');
        });

        it('should assign unique IDs to all items', () => {
            contribution.registerRibbonItems(mockRegistry);

            const ids = registeredItems.map(item => item.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).to.equal(ids.length);
        });

        it('should use codicon icons', () => {
            contribution.registerRibbonItems(mockRegistry);

            for (const item of registeredItems) {
                expect(item.icon).to.match(/^codicon codicon-/);
            }
        });

        it('should have proper ordering', () => {
            contribution.registerRibbonItems(mockRegistry);

            // Left sidebar top items should come before bottom items
            const filesOrder = registeredItems.find(item => item.id === 'ribbon.files')?.order;
            const graphOrder = registeredItems.find(item => item.id === 'ribbon.graph')?.order;

            expect(filesOrder).to.be.lessThan(graphOrder!);

            // Items within same group should have incremental ordering
            const filesItem = registeredItems.find(item => item.id === 'ribbon.files')?.order;
            const searchItem = registeredItems.find(item => item.id === 'ribbon.search')?.order;

            expect(filesItem).to.be.lessThan(searchItem!);
        });
    });
});
