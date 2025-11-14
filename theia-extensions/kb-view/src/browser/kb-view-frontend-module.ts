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

import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { PreferenceContribution } from '@theia/core/lib/common/preferences';
import { ViewModeService, ViewModeServiceImpl } from './view-mode-service';
import { KBViewContribution } from './kb-view-contribution';
import { KB_VIEW_PREFERENCES_SCHEMA } from './kb-view-preferences';

export default new ContainerModule(bind => {
    // Preference schema
    bind(PreferenceContribution).toConstantValue({ schema: KB_VIEW_PREFERENCES_SCHEMA });

    // Core service
    bind(ViewModeService).to(ViewModeServiceImpl).inSingletonScope();

    // Command and menu contributions
    bind(KBViewContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(KBViewContribution);
    bind(MenuContribution).toService(KBViewContribution);
});
