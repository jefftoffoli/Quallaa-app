/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Workspace contribution that initializes knowledge base indexing
 * when workspace is opened/changed
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { KnowledgeBaseService } from '../common/knowledge-base-protocol';

@injectable()
export class KnowledgeBaseWorkspaceContribution implements FrontendApplicationContribution {
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    @postConstruct()
    protected init(): void {
        // Listen to workspace changes
        this.workspaceService.onWorkspaceChanged(() => {
            console.log('[KnowledgeBase] Workspace changed event fired');
            this.indexWorkspace();
        });

        // Also listen to workspace location changes
        this.workspaceService.onWorkspaceLocationChanged(newLocation => {
            console.log('[KnowledgeBase] Workspace location changed:', newLocation?.resource?.toString());
            this.indexWorkspace();
        });
    }

    async onStart(): Promise<void> {
        // Wait a moment for workspace to be fully loaded before indexing
        // The workspace parameter takes time to process
        console.log('[KnowledgeBase] onStart called, waiting for workspace to load...');

        setTimeout(async () => {
            await this.indexWorkspace();
        }, 1000); // Give workspace time to load from --workspace parameter
    }

    protected async indexWorkspace(): Promise<void> {
        const roots = await this.workspaceService.roots;

        console.log('[KnowledgeBase] Found workspace roots:', roots.length);
        roots.forEach((root, i) => {
            console.log(`[KnowledgeBase]   Root ${i}: ${root.resource.toString()}`);
        });

        if (roots.length === 0) {
            console.log('[KnowledgeBase] No workspace roots found');
            return;
        }

        // Index all workspace roots
        // For multi-root workspaces, we index each root separately
        for (const root of roots) {
            const workspaceRoot = root.resource.toString();

            try {
                await this.knowledgeBaseService.indexWorkspace(workspaceRoot);
            } catch (error) {
                console.error('[KnowledgeBase] Failed to index workspace:', error);
            }
        }
    }
}
