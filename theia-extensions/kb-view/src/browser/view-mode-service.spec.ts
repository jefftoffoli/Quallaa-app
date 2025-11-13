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
import { ViewModeService } from './view-mode-service';

describe('ViewModeService', () => {
    let service: ViewModeService;
    let preferenceService: MockPreferenceService;
    let messageService: MockMessageService;
    let windowService: MockWindowService;

    class MockPreferenceService {
        private preferences = new Map<string, any>();
        private listeners: Array<(event: any) => void> = [];

        get<T>(key: string, defaultValue: T): T {
            return this.preferences.get(key) ?? defaultValue;
        }

        set(key: string, value: any): void {
            const oldValue = this.preferences.get(key);
            this.preferences.set(key, value);
            this.listeners.forEach(listener =>
                listener({
                    preferenceName: key,
                    newValue: value,
                    oldValue,
                })
            );
        }

        onPreferenceChanged(listener: (event: any) => void): void {
            this.listeners.push(listener);
        }
    }

    class MockMessageService {
        lastMessage: string | undefined;
        lastActions: string[] = [];
        response: string | undefined = 'Reload Now';

        async info(message: string, ...actions: string[]): Promise<string | undefined> {
            this.lastMessage = message;
            this.lastActions = actions;
            return this.response;
        }
    }

    class MockWindowService {
        reloadCalled = false;

        reload(): void {
            this.reloadCalled = true;
        }
    }

    beforeEach(() => {
        preferenceService = new MockPreferenceService();
        messageService = new MockMessageService();
        windowService = new MockWindowService();

        service = new ViewModeService();
        (service as any).preferenceService = preferenceService;
        (service as any).messageService = messageService;
        (service as any).windowService = windowService;
        (service as any).init();
    });

    describe('initialization', () => {
        it('should read initial preference', () => {
            preferenceService.set('quallaa.viewMode', 'kb-view');

            const newService = new ViewModeService();
            (newService as any).preferenceService = preferenceService;
            (newService as any).messageService = messageService;
            (newService as any).windowService = windowService;
            (newService as any).init();

            expect(newService.getCurrentMode()).to.equal('kb-view');
        });

        it('should default to developer mode', () => {
            expect(service.getCurrentMode()).to.equal('developer');
        });
    });

    describe('getCurrentMode', () => {
        it('should return current mode', () => {
            expect(service.getCurrentMode()).to.equal('developer');
        });
    });

    describe('switchMode', () => {
        it('should show dialog with correct message for KB View', async () => {
            preferenceService.set('quallaa.viewMode', 'kb-view');

            // Wait for preference change to trigger switchMode
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(messageService.lastMessage).to.include('KB View');
            expect(messageService.lastMessage).to.include('reload');
        });

        it('should show dialog with correct message for Developer View', async () => {
            preferenceService.set('quallaa.viewMode', 'developer');

            // Wait for preference change to trigger switchMode
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(messageService.lastMessage).to.include('Developer View');
            expect(messageService.lastMessage).to.include('reload');
        });

        it('should reload window when user confirms', async () => {
            messageService.response = 'Reload Now';
            preferenceService.set('quallaa.viewMode', 'kb-view');

            // Wait for preference change and dialog
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(windowService.reloadCalled).to.be.true;
        });

        it('should not reload window when user declines', async () => {
            messageService.response = 'Later';
            preferenceService.set('quallaa.viewMode', 'kb-view');

            // Wait for preference change and dialog
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(windowService.reloadCalled).to.be.false;
        });

        it('should provide correct dialog actions', async () => {
            preferenceService.set('quallaa.viewMode', 'kb-view');

            // Wait for preference change
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(messageService.lastActions).to.deep.equal(['Reload Now', 'Later']);
        });
    });
});
