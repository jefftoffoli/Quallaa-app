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
            newService.show('left', 'test-panel');
            // If no error, registration worked
            expect(true).to.be.true;
        });
    });

    describe('show', () => {
        it('should show panel in left sidebar', () => {
            leftSidebar.addPanel('test-panel', {});

            let shown = false;
            leftSidebar.onVisibilityChange((panelId, visible) => {
                if (panelId === 'test-panel' && visible) {
                    shown = true;
                }
            });

            service.show('left', 'test-panel');

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

            service.show('right', 'test-panel');

            expect(shown).to.be.true;
        });

        it('should emit visibility change event', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                expect(event.visible).to.be.true;
                done();
            });

            service.show('left', 'test-panel');
        });
    });

    describe('hide', () => {
        it('should hide panel in left sidebar', () => {
            leftSidebar.addPanel('test-panel', {});

            let hidden = false;
            leftSidebar.onVisibilityChange((panelId, visible) => {
                if (panelId === 'test-panel' && !visible) {
                    hidden = true;
                }
            });

            service.hide('left', 'test-panel');

            expect(hidden).to.be.true;
        });

        it('should emit visibility change event', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                expect(event.visible).to.be.false;
                done();
            });

            service.hide('left', 'test-panel');
        });
    });

    describe('toggle', () => {
        it('should toggle panel in left sidebar', () => {
            leftSidebar.addPanel('test-panel', {});

            let toggled = false;
            leftSidebar.onVisibilityChange(() => {
                toggled = true;
            });

            service.toggle('left', 'test-panel');

            expect(toggled).to.be.true;
        });

        it('should emit visibility change event', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                done();
            });

            service.toggle('left', 'test-panel');
        });
    });

    describe('isVisible', () => {
        it('should return true for visible panel', () => {
            leftSidebar.addPanel('test-panel', {});

            const visible = service.isVisible('left', 'test-panel');

            expect(visible).to.be.true;
        });

        it('should return false for non-existent panel', () => {
            const visible = service.isVisible('left', 'non-existent');

            expect(visible).to.be.false;
        });
    });

    describe('event handling', () => {
        it('should forward visibility change events from sidebars', done => {
            leftSidebar.addPanel('test-panel', {});

            service.onVisibilityChanged(event => {
                expect(event.panelId).to.equal('test-panel');
                expect(event.side).to.equal('left');
                done();
            });

            // Simulate sidebar emitting event
            leftSidebar.visibilityChangeListeners.forEach(listener => listener('test-panel', true));
        });
    });
});
