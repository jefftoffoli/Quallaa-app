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
import '../../src/browser/style/backlinks.css';
import '../../src/browser/style/graph.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
// eslint-disable-next-line deprecation/deprecation
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging';
import { WikiLinkContribution } from './wiki-links/wiki-link-contribution';
import { WikiLinkCompletionProvider } from './wiki-links/wiki-link-completion-provider';
import { WikiLinkProvider } from './wiki-links/wiki-link-provider';
import { KnowledgeBaseWorkspaceContribution } from './knowledge-base-workspace-contribution';
import { KnowledgeBaseService, KnowledgeBasePath } from '../common/knowledge-base-protocol';
import { BacklinksWidget, BACKLINKS_WIDGET_ID } from './backlinks/backlinks-widget';
import { BacklinksContribution } from './backlinks/backlinks-contribution';
import { DailyNotesContribution } from './daily-notes/daily-notes-contribution';
import { QuickSwitcherContribution } from './quick-switcher/quick-switcher-contribution';
import { GraphWidget, GRAPH_WIDGET_ID } from './graph/graph-widget';
import { GraphContribution } from './graph/graph-contribution';

export default new ContainerModule(bind => {
    // Wiki link services - following Foam's pattern: LinkProvider handles everything
    bind(WikiLinkCompletionProvider).toSelf().inSingletonScope();
    bind(WikiLinkProvider).toSelf().inSingletonScope();

    // Workspace indexing contribution
    bind(KnowledgeBaseWorkspaceContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(KnowledgeBaseWorkspaceContribution);

    // Main contribution
    bind(WikiLinkContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(WikiLinkContribution);
    bind(CommandContribution).toService(WikiLinkContribution);

    // Backlinks panel - following Foam's connections pattern
    bind(BacklinksWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: BACKLINKS_WIDGET_ID,
            createWidget: () => ctx.container.get<BacklinksWidget>(BacklinksWidget),
        }))
        .inSingletonScope();
    bind(BacklinksContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BacklinksContribution);
    bind(CommandContribution).toService(BacklinksContribution);
    bind(MenuContribution).toService(BacklinksContribution);

    // Daily notes - following Foam's dated-notes pattern
    bind(DailyNotesContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(DailyNotesContribution);

    // Quick Switcher - following Foam's workspace-symbol-provider pattern
    bind(QuickSwitcherContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(QuickSwitcherContribution);

    // Knowledge Graph - following Foam's dataviz pattern
    bind(GraphWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: GRAPH_WIDGET_ID,
            createWidget: () => ctx.container.get<GraphWidget>(GraphWidget),
        }))
        .inSingletonScope();
    bind(GraphContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(GraphContribution);
    bind(CommandContribution).toService(GraphContribution);
    bind(MenuContribution).toService(GraphContribution);

    // Connect to backend service via JSON-RPC
    bind(KnowledgeBaseService)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy<KnowledgeBaseService>(KnowledgeBasePath);
        })
        .inSingletonScope();
});
