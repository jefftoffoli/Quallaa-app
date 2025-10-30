/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Knowledge Graph visualization widget
 * Simplified view following backlinks panel pattern
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { BaseWidget, Message } from '@theia/core/lib/browser/widgets';
import { OpenerService, open } from '@theia/core/lib/browser';
import { KnowledgeBaseService, GraphData, GraphNode } from '../../common/knowledge-base-protocol';
import URI from '@theia/core/lib/common/uri';

export const GRAPH_WIDGET_ID = 'knowledge-base-graph-widget';

@injectable()
export class GraphWidget extends BaseWidget {
    static readonly ID = GRAPH_WIDGET_ID;
    static readonly LABEL = 'Knowledge Graph';

    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    private graphData: GraphData | undefined;

    constructor() {
        super();
        this.id = GRAPH_WIDGET_ID;
        this.title.label = GraphWidget.LABEL;
        this.title.caption = GraphWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-graph';
        this.addClass('theia-graph-widget');
    }

    @postConstruct()
    protected init(): void {
        this.update();
        this.loadGraphData();
    }

    protected async loadGraphData(): Promise<void> {
        try {
            this.graphData = await this.knowledgeBaseService.getGraphData();
            this.update();
        } catch (error) {
            console.error('[GraphWidget] Failed to load graph data:', error);
            this.graphData = { nodes: [], links: [] };
            this.update();
        }
    }

    protected override onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.loadGraphData();
    }

    protected override onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.render();
    }

    protected render(): void {
        this.node.innerHTML = '';

        if (!this.graphData) {
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'theia-widget-noInfo';
            loadingMsg.textContent = 'Loading knowledge graph...';
            this.node.appendChild(loadingMsg);
            return;
        }

        if (this.graphData.nodes.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'theia-widget-noInfo';
            emptyMsg.textContent = 'No notes in workspace';
            this.node.appendChild(emptyMsg);
            return;
        }

        const container = document.createElement('div');
        container.className = 'graph-container';

        // Add summary header
        const summary = document.createElement('div');
        summary.className = 'graph-summary';
        const noteNodes = this.graphData.nodes.filter(n => n.type === 'note');
        const placeholderNodes = this.graphData.nodes.filter(n => n.type === 'placeholder');
        summary.innerHTML = `
            <div class="graph-stats">
                <span class="stat-item"><span class="codicon codicon-file"></span> ${noteNodes.length} notes</span>
                <span class="stat-item"><span class="codicon codicon-link"></span> ${this.graphData.links.length} links</span>
                ${placeholderNodes.length > 0 ? `<span class="stat-item"><span class="codicon codicon-warning"></span> ${placeholderNodes.length} unresolved</span>` : ''}
            </div>
        `;
        container.appendChild(summary);

        // Group nodes by their connections
        const nodeConnections = this.getNodeConnections();

        // Sort nodes by number of connections (most connected first)
        const sortedNodes = [...noteNodes].sort((a, b) => {
            const aConnections = nodeConnections.get(a.id)?.length || 0;
            const bConnections = nodeConnections.get(b.id)?.length || 0;
            return bConnections - aConnections;
        });

        // Render each note node with its connections
        for (const node of sortedNodes) {
            const connections = nodeConnections.get(node.id) || [];
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'graph-node-group';

            // Node header (clickable)
            const header = document.createElement('div');
            header.className = 'graph-node-header';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'codicon codicon-file';
            header.appendChild(iconSpan);
            header.appendChild(document.createTextNode(` ${node.label} `));

            if (connections.length > 0) {
                const countSpan = document.createElement('span');
                countSpan.className = 'graph-connection-count';
                countSpan.textContent = `(${connections.length} ${connections.length === 1 ? 'link' : 'links'})`;
                header.appendChild(countSpan);
            }

            header.onclick = async () => {
                await this.openNode(node);
            };
            nodeDiv.appendChild(header);

            // Connections list
            if (connections.length > 0) {
                const connectionsList = document.createElement('div');
                connectionsList.className = 'graph-connections';

                for (const targetNode of connections) {
                    const connItem = document.createElement('div');
                    connItem.className = `graph-connection-item ${targetNode.type === 'placeholder' ? 'placeholder' : ''}`;

                    const connIcon = document.createElement('span');
                    connIcon.className = targetNode.type === 'placeholder' ? 'codicon codicon-warning' : 'codicon codicon-arrow-right';
                    connItem.appendChild(connIcon);
                    connItem.appendChild(document.createTextNode(` ${targetNode.label}`));

                    if (targetNode.type === 'note') {
                        connItem.onclick = async e => {
                            e.stopPropagation();
                            await this.openNode(targetNode);
                        };
                    } else {
                        connItem.title = 'Unresolved link - note does not exist';
                    }

                    connectionsList.appendChild(connItem);
                }

                nodeDiv.appendChild(connectionsList);
            }

            container.appendChild(nodeDiv);
        }

        this.node.appendChild(container);
    }

    private getNodeConnections(): Map<string, GraphNode[]> {
        const connections = new Map<string, GraphNode[]>();

        if (!this.graphData) {
            return connections;
        }

        for (const link of this.graphData.links) {
            const targetNode = this.graphData.nodes.find(n => n.id === link.target);
            if (targetNode) {
                const existing = connections.get(link.source) || [];
                existing.push(targetNode);
                connections.set(link.source, existing);
            }
        }

        return connections;
    }

    private async openNode(node: GraphNode): Promise<void> {
        if (node.type !== 'note') {
            return;
        }

        try {
            const uri = new URI(node.id);
            await open(this.openerService, uri);
        } catch (error) {
            console.error('[GraphWidget] Failed to open note:', error);
        }
    }
}
