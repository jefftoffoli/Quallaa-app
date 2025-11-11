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
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { PreferenceContribution } from '@theia/core/lib/common/preferences/preference-schema';
import { SidebarService, RibbonItemRegistry, RibbonContribution } from '../common/kb-view-protocol';
import { SidebarServiceImpl } from './sidebar/sidebar-service';
import { RibbonItemRegistryImpl } from './ribbon/ribbon-registry';
import { DefaultRibbonContribution } from './ribbon/default-ribbon-contribution';
import { RibbonWidget } from './ribbon/ribbon-widget';
import { ViewModeService } from './view-mode-service';
import { KB_VIEW_PREFERENCES_SCHEMA } from './kb-view-preferences';
import { KBViewShell } from './shell/kb-view-shell';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';

// Import CSS in order: tokens → utilities → components
import '../../src/browser/style/design-tokens.css';
import '../../src/browser/style/theme-utils.css';
import '../../src/browser/style/ribbon.css';
import '../../src/browser/style/sidebar.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // Preferences
    bind(PreferenceContribution).toConstantValue({ schema: KB_VIEW_PREFERENCES_SCHEMA });

    // View mode service
    bind(ViewModeService).toSelf().inSingletonScope();

    // Sidebar service - bind both interface and implementation
    bind(SidebarServiceImpl).toSelf().inSingletonScope();
    bind(SidebarService).toService(SidebarServiceImpl);

    // Ribbon registry
    bind(RibbonItemRegistry).to(RibbonItemRegistryImpl).inSingletonScope();

    // Ribbon contribution point
    bindContributionProvider(bind, RibbonContribution);

    // Default ribbon items
    bind(RibbonContribution).to(DefaultRibbonContribution).inSingletonScope();

    // Ribbon widget
    bind(RibbonWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: RibbonWidget.ID,
            createWidget: () => ctx.container.get<RibbonWidget>(RibbonWidget),
        }))
        .inSingletonScope();

    // IMPORTANT: Always rebind ApplicationShell to KBViewShell
    // KBViewShell will check the preference and choose the appropriate layout
    // NOTE: Due to timing issues with PreferenceService initialization, the preference
    // is read synchronously from settings.json on the backend. This is set by
    // the kb-view backend module before the frontend loads.
    console.log('[kb-view] Replacing ApplicationShell with KBViewShell');
    if (isBound(ApplicationShell)) {
        rebind(ApplicationShell).to(KBViewShell).inSingletonScope();
    } else {
        bind(ApplicationShell).to(KBViewShell).inSingletonScope();
    }
});
