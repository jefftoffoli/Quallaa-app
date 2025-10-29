/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/
/**
 * Frontend module for knowledge base extension
 */

import '../../src/browser/style/wiki-links.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
// eslint-disable-next-line deprecation/deprecation
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging';
import { WikiLinkContribution } from './wiki-links/wiki-link-contribution';
import { WikiLinkCompletionProvider } from './wiki-links/wiki-link-completion-provider';
import { WikiLinkProvider } from './wiki-links/wiki-link-provider';
import { WikiLinkNavigator } from './wiki-links/wiki-link-navigator';
import { KnowledgeBaseWorkspaceContribution } from './knowledge-base-workspace-contribution';
import { KnowledgeBaseService, KnowledgeBasePath } from '../common/knowledge-base-protocol';

export default new ContainerModule(bind => {
    // Wiki link services
    bind(WikiLinkCompletionProvider).toSelf().inSingletonScope();
    bind(WikiLinkProvider).toSelf().inSingletonScope();
    bind(WikiLinkNavigator).toSelf().inSingletonScope();

    // Workspace indexing contribution
    bind(KnowledgeBaseWorkspaceContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(KnowledgeBaseWorkspaceContribution);

    // Main contribution
    bind(WikiLinkContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(WikiLinkContribution);

    // Connect to backend service via JSON-RPC
    bind(KnowledgeBaseService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<KnowledgeBaseService>(KnowledgeBasePath);
    }).inSingletonScope();
});
