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

import { PreferenceSchema, PreferenceContribution } from '@theia/core/lib/common/preferences/preference-schema';
import { PreferenceScope } from '@theia/core/lib/common/preferences/preference-scope';
import { interfaces } from '@theia/core/shared/inversify';

export const KB_VIEW_MODE_PREFERENCE = 'quallaa.viewMode';

export const KB_VIEW_PREFERENCES_SCHEMA: PreferenceSchema = {
    properties: {
        [KB_VIEW_MODE_PREFERENCE]: {
            type: 'string',
            enum: ['kb-view', 'developer'],
            default: 'kb-view', // Default to KB View mode
            description: 'View mode: KB View (knowledge-first) or Developer View (full IDE)',
            scope: PreferenceScope.User,
        },
    },
};

export function bindKBViewPreferences(bind: interfaces.Bind): void {
    bind(PreferenceContribution).toConstantValue({ schema: KB_VIEW_PREFERENCES_SCHEMA });
}
