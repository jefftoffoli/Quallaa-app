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

import { PreferenceSchema, PreferenceContribution } from '@theia/core/lib/common/preferences';

export const KB_VIEW_PREFERENCES_SCHEMA: PreferenceSchema = {
    properties: {
        'kbView.mode': {
            type: 'string',
            enum: ['kb-view', 'developer'],
            default: 'developer',
            description: 'Current view mode: KB View (knowledge management) or Developer (full IDE)',
        },
        'kbView.hideFileExtensions': {
            type: 'boolean',
            default: true,
            description: 'Hide .md file extensions in KB View mode',
        },
        'kbView.autoSwitchWidgets': {
            type: 'boolean',
            default: true,
            description: 'Automatically open KB widgets when switching to KB View mode',
        },
    },
};

export interface KBViewConfiguration {
    'kbView.mode': 'kb-view' | 'developer';
    'kbView.hideFileExtensions': boolean;
    'kbView.autoSwitchWidgets': boolean;
}

export const KBViewPreferenceContribution = Symbol('KBViewPreferenceContribution');
export type KBViewPreferenceContribution = PreferenceContribution;
