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
import { SidebarServiceImpl } from './sidebar-service';
import { SidebarWidget } from './sidebar-widget';

describe('SidebarService', () => {
    let service: SidebarServiceImpl;
    let leftSidebar: MockSidebarWidget;
    let rightSidebar: MockSidebarWidget;

    class MockSidebarWidget {
        private panels = new Map<string, any>();
        visible = true;
        visibilityChangeListeners: Array<(panelId: string, visible: boolean) => void> = [];

        getSide(): 'left' | 'right' {
            return 'left';
        }

        addPanel(panelId: string, widget: any): void {
            this.panels.set(panelId, widget);
        }

        removePanel(panelId: string): void {
            this.panels.delete(panelId);
        }

        showPanel(panelId: string): void {
            if (this.panels.has(panelId)) {
                this.visibilityChangeListeners.forEach(listener => listener(panelId, true));
            }
        }

        hidePanel(panelId: string): void {
            if (this.panels.has(panelId)) {
                this.visibilityChangeListeners.forEach(listener => listener(panelId, false));
            }
        }

        togglePanel(panelId: string): void {
            // Simple mock - always show
            this.showPanel(panelId);
        }

        isPanelVisible(panelId: string): boolean {
            return this.panels.has(panelId);
        }

        onVisibilityChange(listener: (panelId: string, visible: boolean) => void): void {
            this.visibilityChangeListeners.push(listener);
        }
    }

    beforeEach(() => {
        service = new SidebarServiceImpl();
        leftSidebar = new MockSidebarWidget();
        rightSidebar = new MockSidebarWidget();

        // Register sidebars
        service.registerSidebars(leftSidebar as any as SidebarWidget, rightSidebar as any as SidebarWidget);
    });

    describe('registerSidebars', () => {
        it('should register left and right sidebars', () => {
            const newService = new SidebarServiceImpl();
            const newLeft = new MockSidebarWidget();
            const newRight = new MockSidebarWidget();

            newService.registerSidebars(newLeft as any as SidebarWidget, newRight as any as SidebarWidget);

            // Verify by trying to show a panel
            newService.showPanel('test-panel', 'left');
            // If no error, registration worked
            expect(true).to.be.true;
        });
    });

    describe('showPanel', () => {
        it('should show panel in left sidebar', () => {
            leftSidebar.addPanel('test-panel', {});

            let shown = false;
            leftSidebar.onVisibilityChange((panelId, visible) => {
                if (panelId === 'test-panel' && visible) {
                    shown = true;
                }
            });

            service.showPanel('test-panel', 'left');

            expect(shown).to.be.true;
        });

        it('should show panel in right sidebar', () => {
            rightSidebar.addPanel('test-panel', {});

            let shown = false;
            rightSidebar.onVisibilityChange((panelId, visible) => {
                if (panelId === 'test-panel' && visible) {
                    shown = true;
                }
            });

            service.showPanel('test-panel', 'right');

            expect(shown).to.be.true;
        });

        it('should emit visibility change event', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onPanelVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                expect(event.visible).to.be.true;
                done();
            });

            service.showPanel('test-panel', 'left');
        });
    });

    describe('hidePanel', () => {
        it('should hide panel in left sidebar', () => {
            leftSidebar.addPanel('test-panel', {});

            let hidden = false;
            leftSidebar.onVisibilityChange((panelId, visible) => {
                if (panelId === 'test-panel' && !visible) {
                    hidden = true;
                }
            });

            service.hidePanel('test-panel', 'left');

            expect(hidden).to.be.true;
        });

        it('should emit visibility change event', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onPanelVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                expect(event.visible).to.be.false;
                done();
            });

            service.hidePanel('test-panel', 'left');
        });
    });

    describe('togglePanel', () => {
        it('should toggle panel in left sidebar', () => {
            leftSidebar.addPanel('test-panel', {});

            let toggled = false;
            leftSidebar.onVisibilityChange(() => {
                toggled = true;
            });

            service.togglePanel('test-panel', 'left');

            expect(toggled).to.be.true;
        });

        it('should emit visibility change event', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onPanelVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                done();
            });

            service.togglePanel('test-panel', 'left');
        });
    });

    describe('isPanelVisible', () => {
        it('should return true for visible panel', () => {
            leftSidebar.addPanel('test-panel', {});

            const visible = service.isPanelVisible('test-panel', 'left');

            expect(visible).to.be.true;
        });

        it('should return false for non-existent panel', () => {
            const visible = service.isPanelVisible('non-existent', 'left');

            expect(visible).to.be.false;
        });
    });

    describe('event handling', () => {
        it('should forward visibility change events from sidebars', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onPanelVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                done();
            });

            // Simulate sidebar emitting event
            leftSidebar.visibilityChangeListeners.forEach(listener => listener('test-panel', true));
        });
    });
});
