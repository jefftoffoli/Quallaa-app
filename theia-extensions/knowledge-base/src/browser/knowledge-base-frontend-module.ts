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

/**
 * Frontend module for knowledge base extension
 */
import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging';
import { WikiLinkContribution } from './wiki-links/wiki-link-contribution';
import { WikiLinkCompletionProvider } from './wiki-links/wiki-link-completion-provider';
import { WikiLinkDetector } from './wiki-links/wiki-link-detector';
import { WikiLinkNavigator } from './wiki-links/wiki-link-navigator';
import { KnowledgeBaseService, KnowledgeBasePath } from '../common/knowledge-base-protocol';

export default new ContainerModule(bind => {
    // Wiki link services
    bind(WikiLinkCompletionProvider).toSelf().inSingletonScope();
    bind(WikiLinkDetector).toSelf().inSingletonScope();
    bind(WikiLinkNavigator).toSelf().inSingletonScope();

    // Main contribution
    bind(WikiLinkContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(WikiLinkContribution);

    // Connect to backend service via JSON-RPC
    bind(KnowledgeBaseService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<KnowledgeBaseService>(KnowledgeBasePath);
    }).inSingletonScope();
});
