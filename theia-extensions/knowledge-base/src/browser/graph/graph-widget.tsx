/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Knowledge Graph visualization widget using D3.js force-directed graph
 * Implements Foam-style graph visualization with interactive nodes and edges
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { BaseWidget, Message } from '@theia/core/lib/browser/widgets';
import { OpenerService, open } from '@theia/core/lib/browser';
import { KnowledgeBaseService, GraphData, GraphNode } from '../../common/knowledge-base-protocol';
import URI from '@theia/core/lib/common/uri';
import * as d3 from 'd3';

export const GRAPH_WIDGET_ID = 'knowledge-base-graph-widget';

// D3 simulation types
interface SimulationNode extends GraphNode {
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    vx?: number;
    vy?: number;
}

interface SimulationLink {
    source: string | SimulationNode;
    target: string | SimulationNode;
}

@injectable()
export class GraphWidget extends BaseWidget {
    static readonly ID = GRAPH_WIDGET_ID;
    static readonly LABEL = 'Knowledge Graph';

    @inject(KnowledgeBaseService)
    protected readonly knowledgeBaseService: KnowledgeBaseService;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    private graphData: GraphData | undefined;
    private simulation: d3.Simulation<SimulationNode, SimulationLink> | undefined;
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;

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

    protected override onBeforeDetach(msg: Message): void {
        super.onBeforeDetach(msg);
        // Stop simulation when widget is detached
        if (this.simulation) {
            this.simulation.stop();
        }
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

        // Create container
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

        // Create SVG element
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('class', 'graph-svg');
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        container.appendChild(svgElement);

        this.node.appendChild(container);

        // Build D3 graph
        this.buildD3Graph(svgElement);
    }

    private buildD3Graph(svgElement: SVGSVGElement): void {
        if (!this.graphData) {
            return;
        }

        // Get container dimensions
        const rect = svgElement.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 600;

        // Clear any existing SVG content
        this.svg = d3.select(svgElement);
        this.svg.selectAll('*').remove();

        // Clone nodes to avoid mutating original data
        const nodes: SimulationNode[] = this.graphData.nodes.map(n => ({ ...n }));
        const links: SimulationLink[] = this.graphData.links.map(l => ({ ...l }));

        // Create zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', event => {
                g.attr('transform', event.transform);
            });

        this.svg.call(zoom);

        // Create main group for zoom/pan
        const g = this.svg.append('g');

        // Create force simulation
        this.simulation = d3.forceSimulation<SimulationNode, SimulationLink>(nodes)
            .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(30));

        // Create arrow markers for directed edges
        const defs = g.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', 'var(--theia-editorWidget-foreground)');

        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'graph-link')
            .attr('stroke', 'var(--theia-editorWidget-foreground)')
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        // Create nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', d => `graph-node ${d.type}`)
            .call(this.createDragBehavior());

        // Add circles for nodes
        node.append('circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', 'var(--theia-editor-background)')
            .attr('stroke-width', 2);

        // Add labels
        node.append('text')
            .attr('class', 'graph-node-label')
            .attr('dx', 12)
            .attr('dy', 4)
            .text(d => d.label)
            .attr('fill', 'var(--theia-editorWidget-foreground)')
            .style('font-size', '12px')
            .style('pointer-events', 'none');

        // Add click handler
        node.on('click', (event, d) => {
            event.stopPropagation();
            this.openNode(d);
        });

        // Add hover effect
        node.on('mouseenter', function (this: Element): void {
            d3.select(this).select('circle')
                .attr('stroke-width', 3);
        });
        node.on('mouseleave', function (this: Element): void {
            d3.select(this).select('circle')
                .attr('stroke-width', 2);
        });

        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as SimulationNode).x!)
                .attr('y1', d => (d.source as SimulationNode).y!)
                .attr('x2', d => (d.target as SimulationNode).x!)
                .attr('y2', d => (d.target as SimulationNode).y!);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    private createDragBehavior(): d3.DragBehavior<Element, SimulationNode, SimulationNode> {
        const dragStarted = (event: d3.D3DragEvent<Element, SimulationNode, SimulationNode>, d: SimulationNode) => {
            if (!event.active && this.simulation) {
                this.simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        };

        const dragged = (event: d3.D3DragEvent<Element, SimulationNode, SimulationNode>, d: SimulationNode) => {
            d.fx = event.x;
            d.fy = event.y;
        };

        const dragEnded = (event: d3.D3DragEvent<Element, SimulationNode, SimulationNode>, d: SimulationNode) => {
            if (!event.active && this.simulation) {
                this.simulation.alphaTarget(0);
            }
            d.fx = undefined;
            d.fy = undefined;
        };

        return d3.drag<Element, SimulationNode, SimulationNode>()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded);
    }

    private getNodeRadius(node: SimulationNode): number {
        if (!this.graphData) {
            return 8;
        }
        // Calculate degree (number of connections)
        const degree = this.graphData.links.filter(
            l => l.source === node.id || l.target === node.id
        ).length;
        // More connections = bigger node
        return 8 + Math.sqrt(degree) * 3;
    }

    private getNodeColor(node: SimulationNode): string {
        if (node.type === 'placeholder') {
            return 'var(--theia-notificationsWarningIcon-foreground)';
        }
        return 'var(--theia-activityBar-activeBorder)';
    }

    private async openNode(node: SimulationNode): Promise<void> {
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
