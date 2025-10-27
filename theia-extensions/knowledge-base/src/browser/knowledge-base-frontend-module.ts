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
