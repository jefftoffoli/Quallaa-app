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
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { KBViewShell } from './kb-view-shell';

/**
 * TEST MODULE - Replaces ApplicationShell with KBViewShell
 *
 * To enable this test:
 * 1. Import this module in kb-view-frontend-module.ts
 * 2. Rebuild the extension
 * 3. Start the application
 * 4. Verify the layout:
 *    - No bottom panel region
 *    - Left and right panels visible simultaneously
 *    - Main area in center
 *
 * IMPORTANT: This is a proof-of-concept test only.
 * Do NOT enable this in production until ViewModeService is implemented.
 */
export const KBViewShellTestModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    console.log('[KBViewShellTestModule] Replacing ApplicationShell with KBViewShell');

    // Rebind ApplicationShell to KBViewShell
    if (isBound(ApplicationShell)) {
        rebind(ApplicationShell).to(KBViewShell).inSingletonScope();
    } else {
        bind(ApplicationShell).to(KBViewShell).inSingletonScope();
    }
});
