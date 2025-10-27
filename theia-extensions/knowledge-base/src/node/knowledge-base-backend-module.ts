/**
 * Backend module for knowledge base extension
 */
import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { KnowledgeBaseService, KnowledgeBasePath } from '../common/knowledge-base-protocol';
import { KnowledgeBaseServiceImpl } from './knowledge-base-service-impl';

export default new ContainerModule(bind => {
    // Bind backend service implementation
    bind(KnowledgeBaseServiceImpl).toSelf().inSingletonScope();
    bind(KnowledgeBaseService).toService(KnowledgeBaseServiceImpl);

    // Expose service to frontend via JSON-RPC
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(KnowledgeBasePath, () =>
            ctx.container.get(KnowledgeBaseService)
        )
    ).inSingletonScope();
});
