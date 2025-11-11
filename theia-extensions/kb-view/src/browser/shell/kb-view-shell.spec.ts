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

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { KBViewShell } from './kb-view-shell';
import { PreferenceService } from '@theia/core/lib/common/preferences/preference-service';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { SidebarServiceImpl } from '../sidebar/sidebar-service';
import { RibbonWidget } from '../ribbon/ribbon-widget';
import { KB_VIEW_MODE_PREFERENCE } from '../kb-view-preferences';

describe('KBViewShell', () => {
    let container: Container;
    let shell: KBViewShell;
    let mockPreferenceService: Partial<PreferenceService>;
    let mockWidgetManager: Partial<WidgetManager>;
    let mockSidebarService: Partial<SidebarServiceImpl>;
    let mockRibbonWidget: Partial<RibbonWidget>;

    beforeEach(() => {
        // Create mock services
        mockPreferenceService = {
            get: (key: string, defaultValue?: any) => {
                if (key === KB_VIEW_MODE_PREFERENCE) {
                    return 'kb-view';
                }
                return defaultValue;
            },
        };

        mockWidgetManager = {};

        mockSidebarService = {
            registerSidebars: () => {},
        };

        mockRibbonWidget = {
            setSide: () => {},
            node: document.createElement('div'),
        };

        // Set up dependency injection container
        container = new Container();
        container.bind(PreferenceService).toConstantValue(mockPreferenceService as PreferenceService);
        container.bind(WidgetManager).toConstantValue(mockWidgetManager as WidgetManager);
        container.bind(SidebarServiceImpl).toConstantValue(mockSidebarService as SidebarServiceImpl);
        container.bind(RibbonWidget).toConstantValue(mockRibbonWidget as RibbonWidget);
        container.bind(KBViewShell).toSelf();

        shell = container.get(KBViewShell);
    });

    describe('KB View mode initialization', () => {
        it('should read preference and set viewMode to kb-view', () => {
            // The shell should have read the preference during init
            expect((shell as any).viewMode).to.equal('kb-view');
        });

        it('should add kb-view-mode CSS class when in kb-view mode', () => {
            expect(shell.node.classList.contains('kb-view-mode')).to.be.true;
        });
    });

    describe('KB View layout creation', () => {
        it('should create custom left sidebar', () => {
            const leftSidebar = (shell as any).leftSidebar;
            expect(leftSidebar).to.exist;
            expect(leftSidebar.id).to.equal('kb-sidebar-left');
        });

        it('should create custom right sidebar', () => {
            const rightSidebar = (shell as any).rightSidebar;
            expect(rightSidebar).to.exist;
            expect(rightSidebar.id).to.equal('kb-sidebar-right');
        });

        it('should add ribbon widget to layout', () => {
            const ribbonWidget = (shell as any).ribbonWidget;
            expect(ribbonWidget).to.exist;
            expect(ribbonWidget).to.equal(mockRibbonWidget);
        });

        it('should register sidebars with sidebar service', () => {
            let registerCalled = false;
            mockSidebarService.registerSidebars = () => {
                registerCalled = true;
            };

            // Re-create shell to trigger initialization
            shell = container.get(KBViewShell);
            expect(registerCalled).to.be.true;
        });
    });

    describe('Layout structure', () => {
        it('should have left sidebar in DOM', () => {
            const leftSidebar = (shell as any).leftSidebar;
            expect(leftSidebar?.node).to.exist;
            expect(leftSidebar?.node.classList.contains('kb-sidebar')).to.be.true;
            expect(leftSidebar?.node.classList.contains('kb-sidebar-left')).to.be.true;
        });

        it('should have right sidebar in DOM', () => {
            const rightSidebar = (shell as any).rightSidebar;
            expect(rightSidebar?.node).to.exist;
            expect(rightSidebar?.node.classList.contains('kb-sidebar')).to.be.true;
            expect(rightSidebar?.node.classList.contains('kb-sidebar-right')).to.be.true;
        });

        it('should set minimum widths on sidebar nodes', () => {
            const leftSidebar = (shell as any).leftSidebar;
            const rightSidebar = (shell as any).rightSidebar;

            expect(leftSidebar?.node.style.minWidth).to.equal('250px');
            expect(rightSidebar?.node.style.minWidth).to.equal('250px');
        });

        it('should set minimum width on ribbon node', () => {
            const ribbonWidget = (shell as any).ribbonWidget;
            expect(ribbonWidget?.node.style.minWidth).to.equal('48px');
        });
    });

    describe('Sidebar visibility', () => {
        it('should have placeholder content in left sidebar', () => {
            const leftSidebar = (shell as any).leftSidebar;
            const content = leftSidebar?.node.textContent;
            expect(content).to.include('Left Sidebar');
            expect(content).to.include('KB View Mode Active');
        });

        it('should have placeholder content in right sidebar', () => {
            const rightSidebar = (shell as any).rightSidebar;
            const content = rightSidebar?.node.textContent;
            expect(content).to.include('Right Sidebar');
            expect(content).to.include('KB View Mode Active');
        });
    });

    describe('Developer mode fallback', () => {
        beforeEach(() => {
            // Set preference to developer mode
            mockPreferenceService.get = (key: string, defaultValue?: any) => {
                if (key === KB_VIEW_MODE_PREFERENCE) {
                    return 'developer';
                }
                return defaultValue;
            };

            shell = container.get(KBViewShell);
        });

        it('should not create custom layout in developer mode', () => {
            expect((shell as any).viewMode).to.equal('developer');
            expect((shell as any).leftSidebar).to.be.undefined;
            expect((shell as any).rightSidebar).to.be.undefined;
        });

        it('should not add kb-view-mode class in developer mode', () => {
            expect(shell.node.classList.contains('kb-view-mode')).to.be.false;
        });
    });
});
