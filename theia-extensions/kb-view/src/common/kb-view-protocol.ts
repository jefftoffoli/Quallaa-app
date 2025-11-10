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

import { Event } from '@theia/core/lib/common/event';

/**
 * Ribbon item definition
 */
export interface RibbonItem {
    id: string;
    icon: string;
    tooltip: string;
    side: 'left' | 'right';
    panelId: string;
    order: number;
    group?: 'top' | 'bottom';
}

/**
 * Registry for ribbon items
 */
export interface RibbonItemRegistry {
    registerItem(item: RibbonItem): void;
    unregisterItem(id: string): void;
    getItems(): RibbonItem[];
    getItem(id: string): RibbonItem | undefined;
    onDidChange: Event<void>;
}

export const RibbonItemRegistry = Symbol('RibbonItemRegistry');

/**
 * Contribution point for ribbon items
 */
export const RibbonContribution = Symbol('RibbonContribution');

export interface RibbonContribution {
    registerRibbonItems(registry: RibbonItemRegistry): void;
}

/**
 * Sidebar visibility change event
 */
export interface SidebarVisibilityChange {
    side: 'left' | 'right';
    panelId: string;
    visible: boolean;
}

/**
 * Service for managing sidebar panel visibility
 */
export interface SidebarService {
    show(side: 'left' | 'right', panelId: string): void;
    hide(side: 'left' | 'right', panelId: string): void;
    toggle(side: 'left' | 'right', panelId: string): void;
    isVisible(side: 'left' | 'right', panelId: string): boolean;
    onVisibilityChanged: Event<SidebarVisibilityChange>;
}

export const SidebarService = Symbol('SidebarService');
