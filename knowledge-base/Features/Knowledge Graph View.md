# Knowledge Graph View

## What It Is

**Knowledge Graph** = Visual representation of notes as nodes and links as edges

Interactive network diagram showing how knowledge connects.

## Physical Metaphor

**Subway Map**

```
Each station = Note
Each line = Link between notes

You can:
- See the whole network
- Find shortest path between stations
- Discover clusters of related stations
- Click station → Go there
```

## Visual Example

```
        ┌─────────┐
        │ Ideas   │
        └────┬────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼──┐ ┌───▼──┐ ┌──▼───┐
│ TODO │ │ Arch │ │ Code │
└──┬───┘ └───┬──┘ └──┬───┘
   │         │       │
   │    ┌────▼───┐   │
   └────► Notes  ◄───┘
        └────────┘
```

## Why It's Powerful

### Discover Connections

```
You create: [[Project A]] and [[Project B]]

Later you add: [[Meeting Notes]]
  - Links to both projects

Graph shows:
  Project A ─── Meeting Notes ─── Project B

"Oh! These projects are related!"
```

### Find Orphans

```
Unconnected notes appear isolated:

  ┌──────┐              ┌──────┐
  │ Note │              │ Solo │
  └──┬───┘              └──────┘
     │                     ↑
  ┌──▼──┐              Orphan!
  │Link │              Should connect
  └─────┘
```

### See Clusters

```
Related notes cluster together:

      Design Cluster
    ┌─────────────────┐
    │ UI  ─── UX      │
    │  └─── Mockups   │
    │         │       │
    │     Feedback    │
    └─────────────────┘

      Code Cluster
    ┌─────────────────┐
    │ API ─── Models  │
    │  └─── Tests     │
    └─────────────────┘
```

## Implementation Approach

### Use D3.js

Same library as [[Foam Project Analysis]]:

```typescript
import * as d3 from 'd3';

@injectable()
export class KnowledgeGraphWidget extends ReactWidget {
    protected buildGraph(data: GraphData): void {
        // Create force simulation
        const simulation = d3
            .forceSimulation(data.nodes)
            .force(
                'link',
                d3.forceLink(data.edges).id(d => d.id)
            )
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Render nodes
        const node = svg
            .selectAll('circle')
            .data(data.nodes)
            .enter()
            .append('circle')
            .attr('r', 10)
            .attr('fill', d => this.getNodeColor(d))
            .on('click', d => this.openNote(d));

        // Render edges
        const link = svg
            .selectAll('line')
            .data(data.edges)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-width', 2);

        // Update positions on tick
        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('cx', d => d.x).attr('cy', d => d.y);
        });
    }
}
```

### Data Structure

```typescript
interface GraphNode {
    id: string; // Note ID
    title: string; // Display name
    uri: URI; // File location
    size?: number; // Number of connections
    color?: string; // Category/tag color
}

interface GraphEdge {
    source: string; // Source note ID
    target: string; // Target note ID
    type?: 'link' | 'embed' | 'tag';
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
```

### Building Graph Data

```typescript
@injectable()
export class GraphDataBuilder {
    @inject(WikiLinkParser)
    protected readonly parser: WikiLinkParser;

    @inject(WorkspaceService)
    protected readonly workspace: WorkspaceService;

    async buildGraph(): Promise<GraphData> {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const nodeMap = new Map<string, GraphNode>();

        // Find all markdown files
        const files = await this.findAllMarkdownFiles();

        // Create nodes
        for (const file of files) {
            const title = await this.extractTitle(file);
            const node: GraphNode = {
                id: file.toString(),
                title,
                uri: file,
                size: 0,
            };
            nodes.push(node);
            nodeMap.set(title, node);
        }

        // Create edges
        for (const file of files) {
            const content = await this.readFile(file);
            const links = this.parser.parseWikiLinks(content);

            const sourceNode = nodeMap.get(await this.extractTitle(file));

            for (const link of links) {
                const targetNode = nodeMap.get(link.target);

                if (sourceNode && targetNode) {
                    edges.push({
                        source: sourceNode.id,
                        target: targetNode.id,
                        type: 'link',
                    });

                    // Increment connection count
                    sourceNode.size = (sourceNode.size || 0) + 1;
                    targetNode.size = (targetNode.size || 0) + 1;
                }
            }
        }

        return { nodes, edges };
    }
}
```

## Interactive Features

### 1. Click Node → Open Note

```typescript
protected openNote(node: GraphNode): void {
  this.editorManager.open(node.uri)
}
```

### 2. Hover → Show Preview

```typescript
protected showPreview(node: GraphNode): void {
  const content = await this.readFile(node.uri)
  const preview = this.extractPreview(content, 200) // First 200 chars

  this.tooltip.show({
    title: node.title,
    content: preview,
    position: { x: node.x, y: node.y }
  })
}
```

### 3. Filter by Tag

```typescript
protected filterByTag(tag: string): void {
  const filtered = this.nodes.filter(node =>
    node.tags?.includes(tag)
  )
  this.updateGraph({ nodes: filtered, edges: this.getEdgesFor(filtered) })
}
```

### 4. Highlight Connected

```typescript
protected highlightConnected(nodeId: string): void {
  // Find all nodes connected to this one
  const connected = new Set<string>()

  for (const edge of this.edges) {
    if (edge.source === nodeId) connected.add(edge.target)
    if (edge.target === nodeId) connected.add(edge.source)
  }

  // Dim unconnected nodes
  this.nodes.forEach(node => {
    node.opacity = connected.has(node.id) ? 1.0 : 0.2
  })

  this.update()
}
```

### 5. Local Graph Mode

```typescript
// Show only current note and its immediate connections
protected showLocalGraph(): void {
  const currentNote = this.editorManager.currentEditor?.uri
  if (!currentNote) return

  const currentNodeId = currentNote.toString()
  const localNodes = [currentNodeId]

  // Add direct neighbors
  for (const edge of this.edges) {
    if (edge.source === currentNodeId) localNodes.push(edge.target)
    if (edge.target === currentNodeId) localNodes.push(edge.source)
  }

  this.updateGraph({
    nodes: this.nodes.filter(n => localNodes.includes(n.id)),
    edges: this.edges.filter(e =>
      localNodes.includes(e.source) && localNodes.includes(e.target)
    )
  })
}
```

## Visual Styling

### Node Size by Connections

```typescript
protected getNodeRadius(node: GraphNode): number {
  // More connections = bigger node
  return 5 + Math.sqrt(node.size || 0) * 3
}
```

### Node Color by Type

```typescript
protected getNodeColor(node: GraphNode): string {
  if (node.tags?.includes('project')) return '#ff6b6b'
  if (node.tags?.includes('idea')) return '#4ecdc4'
  if (node.tags?.includes('daily')) return '#ffd93d'
  return '#95e1d3'  // Default
}
```

### Edge Thickness by Strength

```typescript
// Multiple links = thicker edge
protected getEdgeWidth(edge: GraphEdge): number {
  const count = this.edges.filter(e =>
    (e.source === edge.source && e.target === edge.target) ||
    (e.source === edge.target && e.target === edge.source)
  ).length

  return Math.min(1 + count * 0.5, 5)
}
```

## Performance Optimization

### Limit Nodes

```typescript
// Don't render 10,000 nodes at once
if (nodes.length > 500) {
    // Show most connected nodes
    nodes = nodes.sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, 500);
}
```

### WebGL for Large Graphs

```typescript
// Use WebGL instead of SVG for 1000+ nodes
if (nodes.length > 1000) {
    this.useWebGLRenderer();
} else {
    this.useSVGRenderer();
}
```

### Lazy Loading

```typescript
// Load graph data in background
async onStart(): Promise<void> {
  this.showLoadingSpinner()

  const graphData = await this.graphBuilder.buildGraph()

  this.hideLoadingSpinner()
  this.renderGraph(graphData)
}
```

## Obsidian Comparison

**Obsidian Graph View:**

- Force-directed layout (D3.js)
- Color by folder/tag
- Filter by various criteria
- Local vs global mode

**Our Implementation:**

- Same core features
- Integrated with [[Progressive Disclosure Pattern]]
- Always visible (first-class KB feature)

## Health Metrics Integration

The Knowledge Graph View integrates with [[Knowledge Graph Health Metrics]] to
provide visual indicators of knowledge base health:

### Visual Health Indicators

```typescript
protected getNodeColor(node: GraphNode): string {
  // Color nodes by health metrics
  if (this.isOrphan(node)) {
    return '#ef4444'  // Red for orphaned nodes
  }

  if (this.hasLowCompleteness(node)) {
    return '#f97316'  // Orange for incomplete notes
  }

  if (this.isStale(node)) {
    return '#fbbf24'  // Yellow for stale content
  }

  // Green for healthy nodes
  return '#22c55e'
}

protected getNodeStroke(node: GraphNode): string {
  // Highlight duplicates with dashed border
  if (this.isPotentialDuplicate(node)) {
    return 'dashed'
  }

  return 'solid'
}
```

### Health Dashboard Overlay

```typescript
// Show health metrics alongside graph
export class GraphHealthOverlay extends ReactWidget {
  protected render(): React.ReactNode {
    const metrics = this.metricsService.getCurrentMetrics()

    return <div className="graph-health-overlay">
      <div className="metric-badge">
        <span className="label">Orphans:</span>
        <span className={this.getStatusClass(metrics.orphanRate)}>
          {(metrics.orphanRate * 100).toFixed(1)}%
        </span>
      </div>

      <div className="metric-badge">
        <span className="label">Health:</span>
        <span className={this.getStatusClass(metrics.composite / 100)}>
          {metrics.composite.toFixed(0)}
        </span>
      </div>

      <button onClick={() => this.highlightIssues()}>
        Show Issues
      </button>
    </div>
  }
}
```

### Interactive Maintenance Actions

```typescript
// Right-click node → Maintenance options
protected showNodeContextMenu(node: GraphNode): void {
  const menu: ContextMenuItem[] = [
    {
      label: 'Open Note',
      action: () => this.openNote(node)
    }
  ]

  // Add maintenance actions based on node state
  if (this.isOrphan(node)) {
    menu.push({
      label: 'Find Potential Links',
      action: () => this.suggestLinks(node)
    })
  }

  if (this.isPotentialDuplicate(node)) {
    menu.push({
      label: 'Show Duplicates',
      action: () => this.showDuplicates(node)
    })
  }

  if (this.isStale(node)) {
    menu.push({
      label: 'Archive Note',
      action: () => this.archiveNode(node)
    })
  }

  this.contextMenuService.show(menu)
}
```

### Cluster Health Analysis

```typescript
// Detect over-connected hubs and suggest intermediary concepts
protected analyzeClusterHealth(): ClusterHealthReport {
  const hubs = this.nodes.filter(n => (n.size || 0) > AVERAGE_DEGREE * 3)
  const isolatedClusters = this.detectWeaklyConnected()

  return {
    overConnectedHubs: hubs.map(h => ({
      node: h,
      degree: h.size,
      suggestion: 'Consider creating intermediary concepts'
    })),
    isolatedClusters: isolatedClusters.map(c => ({
      nodes: c,
      suggestion: 'Identify missing bridges between clusters'
    }))
  }
}
```

## Maintenance Features

### Orphan Detection Mode

```
Click "Find Orphans" →
  Red nodes = No connections
  Click node → "Suggest Links"
  Shows similar notes to link to
```

### Duplicate Highlighting

```
Click "Show Duplicates" →
  Dashed borders = Potential duplicates
  Click node → "Compare Similar Notes"
  Shows side-by-side diff
```

### Staleness Visualization

```
Click "Show Stale Content" →
  Yellow nodes = Not updated recently
  Intensity = How stale
  Click node → "Archive or Update"
```

## Related Concepts

- [[Wiki Links]]
- [[Backlinks Panel]]
- [[Foam Project Analysis]]
- [[Project Vision - Knowledge-First IDE]]
- [[View Containers]]
- [[Activity Bar]]
- [[Knowledge Graph Health Metrics]]
- [[Knowledge Base Maintenance]]
- [[AI Deletion Agents]]
