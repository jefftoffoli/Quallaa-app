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
import { SidebarService, RibbonItemRegistry, RibbonContribution } from '../common/kb-view-protocol';
import { SidebarServiceImpl } from './sidebar/sidebar-service';
import { RibbonItemRegistryImpl } from './ribbon/ribbon-registry';
import { DefaultRibbonContribution } from './ribbon/default-ribbon-contribution';
import { RibbonWidget } from './ribbon/ribbon-widget';
// import { KBViewShell } from './shell/kb-view-shell';
// import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';

import '../../src/browser/style/ribbon.css';

export default new ContainerModule((bind /* , unbind, isBound, rebind */) => {
    // Sidebar service
    bind(SidebarService).to(SidebarServiceImpl).inSingletonScope();

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

    // DISABLED - TEST: Replace ApplicationShell with KBViewShell
    // KBViewShell proof-of-concept validated. Will be enabled via ViewModeService.
    // console.log('[kb-view] TEST MODE: Replacing ApplicationShell with KBViewShell');
    // if (isBound(ApplicationShell)) {
    //     rebind(ApplicationShell).to(KBViewShell).inSingletonScope();
    // } else {
    //     bind(ApplicationShell).to(KBViewShell).inSingletonScope();
    // }
});
