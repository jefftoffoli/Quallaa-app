# Knowledge Graph Health Metrics

## Overview

Real-time monitoring and analysis system for tracking knowledge base quality,
identifying technical debt, and predicting maintenance needs. This document
outlines the technical implementation of health metrics for Quallaa's knowledge
management system.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Theia Frontend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Health     │  │   Metrics    │  │   Alert      │  │
│  │  Dashboard   │  │   Widgets    │  │   Panel      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (JSON-RPC)
┌─────────────────────────────────────────────────────────┐
│              Metrics Collection Service                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Graph      │  │   Content    │  │   Usage      │  │
│  │  Analyzer    │  │  Analyzer    │  │  Tracker     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Metrics Storage                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Time-Series │  │  Aggregates  │  │   Alerts     │  │
│  │     DB       │  │    Cache     │  │   Queue      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Event Capture**: File system watchers detect changes (create, modify,
   delete, rename)
2. **Incremental Update**: Only affected metrics recalculated (not full graph
   scan)
3. **Aggregation**: Roll up individual metrics into composite scores
4. **Threshold Checking**: Compare against configured alert thresholds
5. **Visualization**: Push updates to frontend widgets via WebSocket
6. **Historical Storage**: Write to time-series database for trend analysis

---

## Core Metrics

### 1. Completeness Index

**Definition**: Percentage of notes with complete metadata and minimum viable
content.

**Formula**:

```
Completeness Index = (Σ(node_completeness_score) / total_nodes) × 100

node_completeness_score = weighted_average([
  has_title,
  has_content,
  content_length >= MIN_LENGTH,
  has_outgoing_links,
  has_tags_or_frontmatter,
  has_creation_date,
  has_last_modified
])
```

**Implementation**:

```typescript
interface CompletenessConfig {
    minContentLength: number; // Default: 100 chars
    requiredFields: string[]; // ['title', 'content']
    optionalFields: FieldWeight[]; // { field: 'tags', weight: 0.2 }
}

function calculateNodeCompleteness(
    node: KnowledgeNode,
    config: CompletenessConfig
): number {
    let score = 0;
    let totalWeight = 0;

    // Required fields (full weight)
    for (const field of config.requiredFields) {
        totalWeight += 1.0;
        if (node[field] && node[field].length >= config.minContentLength) {
            score += 1.0;
        }
    }

    // Optional fields (partial weight)
    for (const { field, weight } of config.optionalFields) {
        totalWeight += weight;
        if (node[field]) {
            score += weight;
        }
    }

    return score / totalWeight;
}
```

**Target**: >85% for healthy knowledge bases

**Alert Thresholds**:

- Warning: <75%
- Critical: <60%

---

### 2. Duplication Rate

**Definition**: Percentage of notes that are likely duplicates based on
similarity analysis.

**Detection Methods**:

**Lexical Similarity** (fast, first-pass):

```typescript
function levenshteinSimilarity(a: string, b: string): number {
    const distance = levenshtein(a, b);
    const maxLength = Math.max(a.length, b.length);
    return 1 - distance / maxLength;
}

// Threshold: 0.85-0.95 for potential duplicates
```

**Semantic Similarity** (accurate, second-pass):

```typescript
async function semanticSimilarity(
    nodeA: KnowledgeNode,
    nodeB: KnowledgeNode,
    embeddingService: EmbeddingService
): Promise<number> {
    const embA = await embeddingService.getEmbedding(nodeA.content);
    const embB = await embeddingService.getEmbedding(nodeB.content);

    return cosineSimilarity(embA, embB);
}

// Threshold: >0.90 for likely duplicates
```

**Formula**:

```
Duplication Rate = (duplicate_pairs × 2) / total_nodes

where duplicate_pairs = count of (nodeA, nodeB) pairs with similarity > threshold
```

**Implementation Strategy**:

- **Incremental**: Only check new/modified notes against existing corpus
- **Caching**: Store embeddings for reuse
- **Batching**: Process in background, not blocking UI
- **Sampling**: For large KBs (>10k nodes), sample 10% weekly, full scan monthly

**Target**: <5% for healthy knowledge bases

**Alert Thresholds**:

- Warning: >10%
- Critical: >20%

---

### 3. Orphan Rate

**Definition**: Percentage of notes with no incoming or outgoing links.

**Formula**:

```
Orphan Rate = orphaned_nodes / total_nodes

where orphaned_node has: (in_degree == 0) AND (out_degree == 0)
```

**Implementation**:

```typescript
interface GraphMetrics {
    degree: Map<string, number>; // Total connections
    inDegree: Map<string, number>; // Incoming links
    outDegree: Map<string, number>; // Outgoing links
}

function calculateOrphanRate(graph: KnowledgeGraph): number {
    let orphanCount = 0;

    for (const [nodeId, node] of graph.nodes) {
        const inLinks = graph.getIncomingLinks(nodeId).length;
        const outLinks = graph.getOutgoingLinks(nodeId).length;

        if (inLinks === 0 && outLinks === 0) {
            // Grace period for new notes
            const age = Date.now() - node.createdAt;
            if (age > GRACE_PERIOD_MS) {
                orphanCount++;
            }
        }
    }

    return orphanCount / graph.nodes.size;
}
```

**Grace Period Logic**:

- New notes (<48 hours old): Not counted as orphans
- Recently modified notes: Extended grace period
- Explicitly tagged as "inbox": Excluded from calculation

**Target**: <10% for healthy knowledge bases

**Alert Thresholds**:

- Warning: >15%
- Critical: >25%

---

### 4. Staleness Index

**Definition**: Percentage of content that hasn't been updated within
domain-specific timeframes.

**Staleness Score** (per node):

```
staleness = (current_date - last_modified) × (1 / modification_frequency)

where modification_frequency = total_edits / days_since_creation
```

**Combined Freshness Metric**:

```
freshness_score = (0.6 × recency_score) + (0.4 × engagement_score)

recency_score = 1 / (1 + days_since_modification / DECAY_CONSTANT)
engagement_score = normalized(views_last_90_days)
```

**Implementation**:

```typescript
interface StalenessConfig {
    thresholds: Map<string, number>; // Category → days
    decayConstant: number; // How fast freshness decays
    engagementWeight: number; // Balance recency vs engagement
}

function calculateStaleness(
    node: KnowledgeNode,
    config: StalenessConfig
): number {
    const daysSinceModified =
        (Date.now() - node.lastModified) / (1000 * 60 * 60 * 24);

    // Get threshold for node's category
    const threshold =
        config.thresholds.get(node.category) ||
        config.thresholds.get('default');

    // Calculate recency score (exponential decay)
    const recencyScore = Math.exp(-daysSinceModified / config.decayConstant);

    // Calculate engagement score (normalized views)
    const engagementScore = Math.min(1, node.viewsLast90Days / 10);

    // Combine
    const freshnessScore =
        (1 - config.engagementWeight) * recencyScore +
        config.engagementWeight * engagementScore;

    return 1 - freshnessScore; // Convert to staleness
}
```

**Domain-Specific Thresholds**:

```typescript
const STALENESS_THRESHOLDS = new Map([
    ['technical-docs', 90], // 3 months
    ['meeting-notes', 180], // 6 months
    ['daily-notes', 365], // 1 year
    ['reference', 730], // 2 years
    ['default', 180], // 6 months
]);
```

**Target**: <20% for healthy knowledge bases

**Alert Thresholds**:

- Warning: >30%
- Critical: >50%

---

### 5. Graph Structure Metrics

#### Average Degree

**Definition**: Average number of connections per node.

**Formula**:

```
average_degree = (2 × total_edges) / total_vertices
```

**Target Range**: 4-8 for well-connected knowledge bases

**Interpretation**:

- **<2**: Sparse, poor discoverability
- **2-4**: Adequate connectivity
- **4-8**: Healthy, good navigation
- **>8**: Potential over-linking, noise

**Implementation**:

```typescript
function calculateAverageDegree(graph: KnowledgeGraph): number {
    const totalEdges = graph.edges.size;
    const totalNodes = graph.nodes.size;

    return (2 * totalEdges) / totalNodes;
}
```

#### Clustering Coefficient

**Definition**: Measure of local triangle density (how interconnected neighbors
are).

**Formula**:

```
C(node) = (actual_triangles / possible_triangles)

where:
  actual_triangles = count of (neighbor_a, neighbor_b) pairs that are connected
  possible_triangles = k(k-1)/2  (k = node degree)

Global clustering = average(C(node)) across all nodes
```

**Implementation**:

```typescript
function calculateClusteringCoefficient(graph: KnowledgeGraph): number {
    let totalCoefficient = 0;
    let nodeCount = 0;

    for (const [nodeId, node] of graph.nodes) {
        const neighbors = graph.getNeighbors(nodeId);
        const k = neighbors.length;

        if (k < 2) continue; // Need at least 2 neighbors

        let triangles = 0;
        for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
                if (graph.hasEdge(neighbors[i], neighbors[j])) {
                    triangles++;
                }
            }
        }

        const possibleTriangles = (k * (k - 1)) / 2;
        const coefficient = triangles / possibleTriangles;

        totalCoefficient += coefficient;
        nodeCount++;
    }

    return totalCoefficient / nodeCount;
}
```

**Target Range**: 0.3-0.7

**Interpretation**:

- **<0.2**: Sparse connectivity, poor navigation
- **0.2-0.5**: Adequate structure
- **0.5-0.7**: Strong conceptual clustering
- **>0.7**: Over-linking, potential echo chambers

#### Average Path Length

**Definition**: Average number of hops between any two nodes.

**Formula**:

```
APL = (Σ shortest_path(u, v)) / (n × (n-1))

where sum is over all pairs (u, v) of distinct nodes
```

**Implementation** (Floyd-Warshall for small graphs, BFS sampling for large):

```typescript
function calculateAveragePathLength(graph: KnowledgeGraph): number {
    const nodes = Array.from(graph.nodes.keys());
    const n = nodes.length;

    if (n > 1000) {
        // Sample for large graphs
        return sampleAveragePathLength(graph, 1000);
    }

    // Exact calculation for small graphs
    let totalDistance = 0;
    let pairCount = 0;

    for (let i = 0; i < n; i++) {
        const distances = graph.bfs(nodes[i]);

        for (let j = 0; j < n; j++) {
            if (i !== j && distances[nodes[j]] !== Infinity) {
                totalDistance += distances[nodes[j]];
                pairCount++;
            }
        }
    }

    return totalDistance / pairCount;
}
```

**Target Range**: 3-6 hops

**Interpretation**:

- **<3**: Over-connected, flat hierarchy
- **3-6**: "Small world" property, good discoverability
- **>6**: Under-connected, navigation difficulty

#### Network Density

**Definition**: Ratio of actual edges to possible edges.

**Formula**:

```
density = actual_edges / possible_edges
        = actual_edges / (n × (n-1) / 2)

for undirected graphs
```

**Implementation**:

```typescript
function calculateNetworkDensity(graph: KnowledgeGraph): number {
    const n = graph.nodes.size;
    const actualEdges = graph.edges.size;
    const possibleEdges = (n * (n - 1)) / 2;

    return actualEdges / possibleEdges;
}
```

**Target Range**: 0.01-0.10 for large graphs (>1000 nodes)

**Interpretation**:

- **<0.01**: Sparse, potential fragmentation
- **0.01-0.10**: Healthy for large graphs
- **>0.50**: Over-linking, information overload

---

## Composite Health Score

**Formula**:

```
Health Score =
  (30% × Completeness Index) +
  (25% × (1 - Duplication Rate)) +
  (25% × (1 - Orphan Rate)) +
  (20% × (1 - Staleness Index))
```

**Implementation**:

```typescript
interface HealthMetrics {
    completeness: number; // 0-1
    duplication: number; // 0-1
    orphan: number; // 0-1
    staleness: number; // 0-1
    timestamp: number;
}

function calculateCompositeHealth(metrics: HealthMetrics): number {
    return (
        (0.3 * metrics.completeness +
            0.25 * (1 - metrics.duplication) +
            0.25 * (1 - metrics.orphan) +
            0.2 * (1 - metrics.staleness)) *
        100
    ); // Convert to 0-100 scale
}
```

**Interpretation**:

- **90-100**: Excellent health
- **75-89**: Good health
- **60-74**: Fair, maintenance recommended
- **45-59**: Poor, maintenance needed
- **<45**: Critical, immediate action required

---

## Real-Time Monitoring

### Event-Driven Updates

**File System Events**:

```typescript
@injectable()
export class MetricsCollectionService {
    constructor(
        @inject(FileService) private fileService: FileService,
        @inject(KnowledgeGraphService)
        private graphService: KnowledgeGraphService
    ) {
        this.registerWatchers();
    }

    private registerWatchers(): void {
        // Watch for file changes
        this.fileService.onDidFilesChange(event => {
            this.handleFileChange(event);
        });

        // Watch for graph updates
        this.graphService.onGraphChange(change => {
            this.handleGraphChange(change);
        });
    }

    private async handleFileChange(event: FileChangeEvent): Promise<void> {
        for (const change of event.changes) {
            switch (change.type) {
                case FileChangeType.ADDED:
                    await this.onNodeAdded(change.uri);
                    break;
                case FileChangeType.UPDATED:
                    await this.onNodeModified(change.uri);
                    break;
                case FileChangeType.DELETED:
                    await this.onNodeDeleted(change.uri);
                    break;
            }
        }

        // Recalculate composite health
        await this.updateHealthScore();

        // Push to frontend
        this.notifyClients();
    }

    private async onNodeAdded(uri: URI): Promise<void> {
        // Update affected metrics incrementally
        await this.updateMetric('orphan_rate', { added: [uri] });
        await this.updateMetric('completeness', { added: [uri] });
        // Don't check staleness for new nodes (grace period)
    }

    private async onNodeModified(uri: URI): Promise<void> {
        // Update staleness immediately
        await this.updateMetric('staleness', { modified: [uri] });
        // May affect completeness if content changed
        await this.updateMetric('completeness', { modified: [uri] });
        // Check if modification created/removed links
        await this.updateMetric('orphan_rate', { modified: [uri] });
    }
}
```

### Incremental Calculation

**Challenge**: Avoid full graph scans on every change

**Solution**: Maintain incremental state and only recalculate affected portions

```typescript
class IncrementalMetricsCache {
    private orphanSet: Set<string>;
    private degreeMap: Map<string, number>;
    private completenessMap: Map<string, number>;

    async onNodeAdded(nodeId: string, node: KnowledgeNode): Promise<void> {
        // Add to orphan set initially (will remove if links added)
        this.orphanSet.add(nodeId);

        // Calculate completeness for this node
        const completeness = calculateNodeCompleteness(node);
        this.completenessMap.set(nodeId, completeness);

        // Initialize degree to 0
        this.degreeMap.set(nodeId, 0);

        // Recalculate rates (cheap with maintained sets)
        this.updateRates();
    }

    async onLinkAdded(sourceId: string, targetId: string): Promise<void> {
        // Remove both from orphan set
        this.orphanSet.delete(sourceId);
        this.orphanSet.delete(targetId);

        // Update degrees
        this.degreeMap.set(sourceId, (this.degreeMap.get(sourceId) || 0) + 1);
        this.degreeMap.set(targetId, (this.degreeMap.get(targetId) || 0) + 1);

        // Recalculate average degree (cheap)
        this.updateAverageDegree();
    }

    private updateRates(): void {
        const totalNodes = this.completenessMap.size;

        this.orphanRate = this.orphanSet.size / totalNodes;

        let completenessSum = 0;
        for (const score of this.completenessMap.values()) {
            completenessSum += score;
        }
        this.completenessIndex = completenessSum / totalNodes;
    }
}
```

### Performance Optimization

**For Large Knowledge Bases** (>10,000 nodes):

1. **Sampling**: Calculate metrics on representative sample
2. **Caching**: Store intermediate results, invalidate selectively
3. **Debouncing**: Batch rapid changes, update UI after quiescence
4. **Background Jobs**: Run expensive calculations (clustering, path length)
   async
5. **Approximation**: Use sketching algorithms for large-scale estimates

```typescript
interface MetricsConfig {
    updateStrategy: 'realtime' | 'debounced' | 'scheduled';
    debouncePeriod?: number; // ms to wait for quiescence
    scheduleCron?: string; // cron expression for scheduled runs
    samplingThreshold?: number; // KB size to trigger sampling
    sampleSize?: number; // Number of nodes to sample
}

class AdaptiveMetricsCalculator {
    async calculate(
        graph: KnowledgeGraph,
        config: MetricsConfig
    ): Promise<HealthMetrics> {
        const nodeCount = graph.nodes.size;

        if (nodeCount < 1000) {
            // Small KB: exact calculation
            return this.calculateExact(graph);
        } else if (nodeCount < 10000) {
            // Medium KB: exact for cheap metrics, approximation for expensive
            return this.calculateHybrid(graph);
        } else {
            // Large KB: sampling and approximation
            return this.calculateSampled(graph, config.sampleSize || 1000);
        }
    }
}
```

---

## Visualization & Dashboard

### Frontend Components

**Health Dashboard Widget** (`knowledge-base-health-widget.tsx`):

```typescript
@injectable()
export class KnowledgeBaseHealthWidget extends ReactWidget {
  static readonly ID = 'knowledge-base-health';
  static readonly LABEL = 'KB Health';

  @inject(MetricsService)
  protected metricsService: MetricsService;

  protected render(): React.ReactNode {
    return (
      <HealthDashboard
        metricsService={this.metricsService}
      />
    );
  }
}

const HealthDashboard: React.FC<Props> = ({ metricsService }) => {
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [history, setHistory] = useState<HealthHistory>([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = metricsService.onHealthChange(newHealth => {
      setHealth(newHealth);
      setHistory(prev => [...prev, newHealth].slice(-100)); // Keep last 100
    });

    return () => subscription.dispose();
  }, []);

  return (
    <div className="kb-health-dashboard">
      <CompositeHealthScore value={health?.composite || 0} />
      <MetricGrid metrics={health?.components || {}} />
      <TrendChart data={history} />
      <AlertPanel alerts={health?.alerts || []} />
    </div>
  );
};
```

**Composite Health Score Gauge**:

```typescript
const CompositeHealthScore: React.FC<{ value: number }> = ({ value }) => {
  const getColor = (score: number): string => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 75) return '#84cc16'; // lime
    if (score >= 60) return '#eab308'; // yellow
    if (score >= 45) return '#f97316'; // orange
    return '#ef4444';                  // red
  };

  const getLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 45) return 'Poor';
    return 'Critical';
  };

  return (
    <div className="health-score-gauge">
      <svg viewBox="0 0 200 120">
        {/* Background arc */}
        <path d="M 20,100 A 80,80 0 0,1 180,100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12" />

        {/* Score arc */}
        <path d="M 20,100 A 80,80 0 0,1 180,100"
              fill="none"
              stroke={getColor(value)}
              strokeWidth="12"
              strokeDasharray={`${value * 2.51} 251`} />

        {/* Value text */}
        <text x="100" y="80"
              textAnchor="middle"
              fontSize="32"
              fontWeight="bold">
          {Math.round(value)}
        </text>

        {/* Label text */}
        <text x="100" y="105"
              textAnchor="middle"
              fontSize="14"
              fill="#6b7280">
          {getLabel(value)}
        </text>
      </svg>
    </div>
  );
};
```

**Metric Grid** (individual component metrics):

```typescript
const MetricGrid: React.FC<{ metrics: ComponentMetrics }> = ({ metrics }) => {
  const items = [
    {
      key: 'completeness',
      label: 'Completeness',
      value: metrics.completeness,
      target: 0.85,
      format: 'percentage'
    },
    {
      key: 'duplication',
      label: 'Duplicates',
      value: metrics.duplication,
      target: 0.05,
      format: 'percentage',
      inverse: true // Lower is better
    },
    {
      key: 'orphan',
      label: 'Orphans',
      value: metrics.orphan,
      target: 0.10,
      format: 'percentage',
      inverse: true
    },
    {
      key: 'staleness',
      label: 'Stale Content',
      value: metrics.staleness,
      target: 0.20,
      format: 'percentage',
      inverse: true
    },
    {
      key: 'avgDegree',
      label: 'Avg Connections',
      value: metrics.avgDegree,
      target: 6,
      format: 'number'
    },
    {
      key: 'clustering',
      label: 'Clustering',
      value: metrics.clustering,
      target: 0.50,
      format: 'decimal'
    },
  ];

  return (
    <div className="metric-grid">
      {items.map(item => (
        <MetricCard key={item.key} {...item} />
      ))}
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  target,
  format,
  inverse
}) => {
  const isHealthy = inverse
    ? value <= target
    : value >= target;

  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage': return `${(val * 100).toFixed(1)}%`;
      case 'decimal': return val.toFixed(2);
      case 'number': return val.toFixed(1);
      default: return val.toString();
    }
  };

  return (
    <div className={`metric-card ${isHealthy ? 'healthy' : 'warning'}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{formatValue(value)}</div>
      <div className="metric-target">
        Target: {formatValue(target)}
      </div>
      <div className="metric-indicator">
        {isHealthy ? '✓' : '⚠'}
      </div>
    </div>
  );
};
```

**Trend Chart** (time-series visualization):

```typescript
const TrendChart: React.FC<{ data: HealthHistory }> = ({ data }) => {
  const chartData = data.map(point => ({
    timestamp: new Date(point.timestamp),
    composite: point.composite,
    completeness: point.completeness * 100,
    duplication: (1 - point.duplication) * 100,
    orphan: (1 - point.orphan) * 100,
    staleness: (1 - point.staleness) * 100,
  }));

  return (
    <div className="trend-chart">
      <h3>Health Trend (Last 30 Days)</h3>
      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => format(ts, 'MMM d')}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip
          labelFormatter={(ts) => format(ts, 'MMM d, yyyy HH:mm')}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="composite"
          stroke="#8884d8"
          strokeWidth={2}
          name="Overall Health"
        />
        <Line
          type="monotone"
          dataKey="completeness"
          stroke="#82ca9d"
          name="Completeness"
        />
        <Line
          type="monotone"
          dataKey="duplication"
          stroke="#ffc658"
          name="No Duplicates"
        />
      </LineChart>
    </div>
  );
};
```

---

## Alert System

### Threshold-Based Alerts

```typescript
interface AlertThreshold {
    metric: string;
    operator: 'gt' | 'lt' | 'eq';
    value: number;
    severity: 'info' | 'warning' | 'critical';
    message: string;
}

const DEFAULT_THRESHOLDS: AlertThreshold[] = [
    {
        metric: 'completeness',
        operator: 'lt',
        value: 0.75,
        severity: 'warning',
        message:
            'Completeness below target. Many notes missing metadata or content.',
    },
    {
        metric: 'completeness',
        operator: 'lt',
        value: 0.6,
        severity: 'critical',
        message: 'Completeness critically low. Immediate attention needed.',
    },
    {
        metric: 'duplication',
        operator: 'gt',
        value: 0.1,
        severity: 'warning',
        message:
            'High duplication detected. Consider running duplicate detection.',
    },
    {
        metric: 'orphan',
        operator: 'gt',
        value: 0.15,
        severity: 'warning',
        message:
            'Many orphaned notes. Run orphan detection to improve discoverability.',
    },
    {
        metric: 'staleness',
        operator: 'gt',
        value: 0.3,
        severity: 'warning',
        message: 'Significant stale content. Review and archive old notes.',
    },
    {
        metric: 'composite',
        operator: 'lt',
        value: 60,
        severity: 'warning',
        message:
            'Overall health declining. Run maintenance to improve KB quality.',
    },
    {
        metric: 'composite',
        operator: 'lt',
        value: 45,
        severity: 'critical',
        message:
            'Knowledge base health critical. Immediate maintenance required.',
    },
];

@injectable()
export class AlertService {
    private activeAlerts: Map<string, Alert> = new Map();

    constructor(
        @inject(MetricsService) private metricsService: MetricsService,
        @inject(MessageService) private messageService: MessageService
    ) {
        this.metricsService.onHealthChange(health => {
            this.checkThresholds(health);
        });
    }

    private checkThresholds(health: HealthMetrics): void {
        const newAlerts: Alert[] = [];

        for (const threshold of DEFAULT_THRESHOLDS) {
            const value = health[threshold.metric];

            const triggered = this.evaluateThreshold(
                value,
                threshold.operator,
                threshold.value
            );

            if (triggered) {
                const alertId = `${threshold.metric}-${threshold.severity}`;

                if (!this.activeAlerts.has(alertId)) {
                    const alert: Alert = {
                        id: alertId,
                        metric: threshold.metric,
                        severity: threshold.severity,
                        message: threshold.message,
                        timestamp: Date.now(),
                        value,
                    };

                    this.activeAlerts.set(alertId, alert);
                    newAlerts.push(alert);
                }
            } else {
                // Clear alert if no longer triggered
                const alertId = `${threshold.metric}-${threshold.severity}`;
                this.activeAlerts.delete(alertId);
            }
        }

        // Notify user of new alerts
        for (const alert of newAlerts) {
            this.notifyUser(alert);
        }
    }

    private evaluateThreshold(
        value: number,
        operator: string,
        threshold: number
    ): boolean {
        switch (operator) {
            case 'gt':
                return value > threshold;
            case 'lt':
                return value < threshold;
            case 'eq':
                return value === threshold;
            default:
                return false;
        }
    }

    private notifyUser(alert: Alert): void {
        const actions: string[] = [];

        // Suggest actions based on alert type
        if (alert.metric === 'duplication') {
            actions.push('Run Duplicate Detection');
        } else if (alert.metric === 'orphan') {
            actions.push('Find Orphaned Notes');
        } else if (alert.metric === 'staleness') {
            actions.push('Review Stale Content');
        } else if (alert.metric === 'completeness') {
            actions.push('Improve Note Quality');
        }

        this.messageService.show(alert.message, {
            severity: alert.severity,
            actions,
        });
    }
}
```

### Alert Panel UI

```typescript
const AlertPanel: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="alert-panel empty">
        <span className="icon">✓</span>
        <span>No alerts. Knowledge base is healthy.</span>
      </div>
    );
  }

  // Sort by severity (critical first)
  const sorted = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="alert-panel">
      <h3>Active Alerts ({alerts.length})</h3>
      {sorted.map(alert => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
};

const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => {
  const getIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  return (
    <div className={`alert-item ${alert.severity}`}>
      <span className="icon">{getIcon(alert.severity)}</span>
      <div className="content">
        <div className="message">{alert.message}</div>
        <div className="meta">
          {alert.metric} • {format(alert.timestamp, 'MMM d, HH:mm')}
        </div>
      </div>
      <button
        className="action-btn"
        onClick={() => handleAlertAction(alert)}
      >
        Fix
      </button>
    </div>
  );
};
```

---

## Trend Analysis & Prediction

### Historical Data Storage

```typescript
interface MetricsSnapshot {
    timestamp: number;
    metrics: HealthMetrics;
    graphStats: {
        nodeCount: number;
        edgeCount: number;
        avgDegree: number;
        clustering: number;
        avgPathLength: number;
    };
}

@injectable()
export class MetricsHistoryService {
    private readonly SNAPSHOT_INTERVAL = 1000 * 60 * 60; // 1 hour

    constructor(
        @inject(MetricsService) private metricsService: MetricsService,
        @inject(DatabaseService) private db: DatabaseService
    ) {
        this.scheduleSnapshots();
    }

    private scheduleSnapshots(): void {
        setInterval(async () => {
            const snapshot = await this.captureSnapshot();
            await this.db.saveSnapshot(snapshot);
        }, this.SNAPSHOT_INTERVAL);
    }

    async getHistory(
        startTime: number,
        endTime: number
    ): Promise<MetricsSnapshot[]> {
        return this.db.query(
            'SELECT * FROM metrics_history WHERE timestamp BETWEEN ? AND ?',
            [startTime, endTime]
        );
    }

    async getTrend(metric: string, periodDays: number): Promise<TrendData> {
        const endTime = Date.now();
        const startTime = endTime - periodDays * 24 * 60 * 60 * 1000;

        const snapshots = await this.getHistory(startTime, endTime);

        return {
            metric,
            data: snapshots.map(s => ({
                timestamp: s.timestamp,
                value: s.metrics[metric],
            })),
            trend: this.calculateTrend(snapshots, metric),
            prediction: this.predictFuture(snapshots, metric),
        };
    }

    private calculateTrend(
        snapshots: MetricsSnapshot[],
        metric: string
    ): 'improving' | 'stable' | 'declining' {
        if (snapshots.length < 2) return 'stable';

        const values = snapshots.map(s => s.metrics[metric]);
        const slope = this.linearRegression(values);

        // Determine if metric is "positive" (higher is better) or "negative"
        const positiveMetrics = ['completeness'];
        const isPositive = positiveMetrics.includes(metric);

        const threshold = 0.001; // Minimum slope to consider trend

        if (Math.abs(slope) < threshold) return 'stable';

        if (isPositive) {
            return slope > 0 ? 'improving' : 'declining';
        } else {
            return slope < 0 ? 'improving' : 'declining';
        }
    }

    private linearRegression(values: number[]): number {
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        return slope;
    }

    private predictFuture(
        snapshots: MetricsSnapshot[],
        metric: string
    ): number {
        // Simple linear extrapolation
        const values = snapshots.map(s => s.metrics[metric]);
        const slope = this.linearRegression(values);
        const lastValue = values[values.length - 1];

        // Predict 7 days into future
        const prediction = lastValue + slope * 7;

        // Clamp to valid range [0, 1]
        return Math.max(0, Math.min(1, prediction));
    }
}
```

### Predictive Alerts

```typescript
interface PredictiveAlert {
    metric: string;
    currentValue: number;
    predictedValue: number;
    daysUntilThreshold: number;
    message: string;
}

async function generatePredictiveAlerts(
    historyService: MetricsHistoryService
): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    const metrics = ['completeness', 'duplication', 'orphan', 'staleness'];

    for (const metric of metrics) {
        const trend = await historyService.getTrend(metric, 30);

        if (trend.trend === 'declining') {
            const threshold = THRESHOLDS[metric];
            const daysUntilThreshold = estimateDaysUntilThreshold(
                trend.data,
                threshold
            );

            if (daysUntilThreshold < 14) {
                alerts.push({
                    metric,
                    currentValue: trend.data[trend.data.length - 1].value,
                    predictedValue: trend.prediction,
                    daysUntilThreshold,
                    message: `${metric} is declining. May reach warning threshold in ${daysUntilThreshold} days.`,
                });
            }
        }
    }

    return alerts;
}
```

---

## Integration with Maintenance Features

### Triggering Maintenance Actions

```typescript
@injectable()
export class HealthBasedMaintenanceService {
    constructor(
        @inject(MetricsService) private metricsService: MetricsService,
        @inject(MaintenanceService)
        private maintenanceService: MaintenanceService,
        @inject(MessageService) private messageService: MessageService
    ) {
        this.registerHealthTriggers();
    }

    private registerHealthTriggers(): void {
        this.metricsService.onHealthChange(async health => {
            // Auto-suggest maintenance based on metrics

            if (health.duplication > 0.15) {
                this.suggestAction(
                    'Run duplicate detection?',
                    'High duplication detected',
                    () => this.maintenanceService.detectDuplicates()
                );
            }

            if (health.orphan > 0.2) {
                this.suggestAction(
                    'Find and link orphaned notes?',
                    'Many orphaned notes found',
                    () => this.maintenanceService.findOrphans()
                );
            }

            if (health.staleness > 0.4) {
                this.suggestAction(
                    'Review stale content?',
                    'Significant stale content detected',
                    () => this.maintenanceService.reviewStaleContent()
                );
            }

            if (health.composite < 60) {
                this.suggestAction(
                    'Run comprehensive maintenance?',
                    'KB health declining',
                    () => this.maintenanceService.runFullMaintenance()
                );
            }
        });
    }

    private suggestAction(
        action: string,
        reason: string,
        callback: () => Promise<void>
    ): void {
        this.messageService
            .show(reason, {
                severity: 'info',
                actions: [action],
            })
            .then(result => {
                if (result === action) {
                    callback();
                }
            });
    }
}
```

### Maintenance Impact Tracking

```typescript
interface MaintenanceEvent {
    type: 'duplicate_merge' | 'orphan_link' | 'stale_archive' | 'full_cleanup';
    timestamp: number;
    itemsAffected: number;
    healthBefore: HealthMetrics;
    healthAfter: HealthMetrics;
}

@injectable()
export class MaintenanceImpactTracker {
    async trackMaintenance(event: MaintenanceEvent): Promise<void> {
        // Calculate improvement
        const improvement = {
            composite:
                event.healthAfter.composite - event.healthBefore.composite,
            completeness:
                event.healthAfter.completeness -
                event.healthBefore.completeness,
            duplication:
                event.healthBefore.duplication - event.healthAfter.duplication, // Reduction is good
            orphan: event.healthBefore.orphan - event.healthAfter.orphan,
            staleness:
                event.healthBefore.staleness - event.healthAfter.staleness,
        };

        // Store for analytics
        await this.db.saveMaintenanceEvent(event, improvement);

        // Show summary to user
        this.showImpactSummary(event, improvement);
    }

    private showImpactSummary(
        event: MaintenanceEvent,
        improvement: MetricImprovements
    ): void {
        const message = `
      Maintenance completed successfully!

      Items affected: ${event.itemsAffected}
      Health improvement: ${improvement.composite > 0 ? '+' : ''}${improvement.composite.toFixed(1)} points

      Details:
      ${improvement.duplication > 0 ? `• Duplicates: -${(improvement.duplication * 100).toFixed(1)}%` : ''}
      ${improvement.orphan > 0 ? `• Orphans: -${(improvement.orphan * 100).toFixed(1)}%` : ''}
      ${improvement.staleness > 0 ? `• Stale content: -${(improvement.staleness * 100).toFixed(1)}%` : ''}
    `.trim();

        this.messageService.show(message, { severity: 'success' });
    }
}
```

---

## Performance Considerations

### Optimization Strategies

**1. Lazy Calculation**:

```typescript
class LazyMetricsCalculator {
    private cache = new Map<string, CachedMetric>();

    async getMetric(name: string): Promise<number> {
        const cached = this.cache.get(name);

        if (cached && !this.isStale(cached)) {
            return cached.value;
        }

        const value = await this.calculate(name);

        this.cache.set(name, {
            value,
            calculatedAt: Date.now(),
            ttl: this.getTTL(name),
        });

        return value;
    }

    private getTTL(metricName: string): number {
        // Different metrics have different update frequencies
        const ttls = {
            composite: 60 * 1000, // 1 minute
            completeness: 5 * 60 * 1000, // 5 minutes
            duplication: 60 * 60 * 1000, // 1 hour (expensive)
            orphan: 5 * 60 * 1000, // 5 minutes
            staleness: 60 * 60 * 1000, // 1 hour
            avgDegree: 5 * 60 * 1000, // 5 minutes
            clustering: 60 * 60 * 1000, // 1 hour (very expensive)
            pathLength: 60 * 60 * 1000, // 1 hour (very expensive)
        };

        return ttls[metricName] || 5 * 60 * 1000;
    }
}
```

**2. Sampling for Large Graphs**:

```typescript
function sampleMetrics(
    graph: KnowledgeGraph,
    sampleSize: number
): Partial<HealthMetrics> {
    const nodes = Array.from(graph.nodes.keys());
    const sample = shuffleAndTake(nodes, sampleSize);

    // Calculate metrics on sample
    let completenessSum = 0;
    let orphanCount = 0;

    for (const nodeId of sample) {
        const node = graph.nodes.get(nodeId)!;
        completenessSum += calculateNodeCompleteness(node);

        if (graph.getDegree(nodeId) === 0) {
            orphanCount++;
        }
    }

    return {
        completeness: completenessSum / sample.length,
        orphan: orphanCount / sample.length,
    };
}
```

**3. Progressive Calculation**:

```typescript
async function* calculateMetricsProgressive(
    graph: KnowledgeGraph
): AsyncGenerator<Partial<HealthMetrics>> {
    // Yield cheap metrics first
    yield {
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.size,
    };

    // Calculate orphan rate (medium cost)
    const orphanRate = await calculateOrphanRate(graph);
    yield { orphan: orphanRate };

    // Calculate completeness (medium cost)
    const completeness = await calculateCompleteness(graph);
    yield { completeness };

    // Calculate duplication (expensive)
    const duplication = await calculateDuplication(graph);
    yield { duplication };

    // Calculate clustering (very expensive)
    const clustering = await calculateClustering(graph);
    yield { clustering };
}
```

---

## Related Documents

- [[Knowledge Base Maintenance]] - Maintenance strategies and practices
- [[AI Deletion Agents]] - Automated cleanup architecture
- [[Knowledge Graph View]] - Visualization and navigation
- [[Theia Extension Architecture]] - Integration points
- [[Backlinks Panel]] - Relationship tracking

---

## Key Insights

1. **Real-time monitoring enables proactive maintenance**: Catch issues before
   they become critical
2. **Incremental calculation scales better**: Full graph scans don't scale
   beyond 10k nodes
3. **Composite metrics provide holistic view**: Single number summarizes complex
   system state
4. **Trend analysis predicts future issues**: "Days until threshold" alerts
   enable planning
5. **Visual dashboards drive engagement**: Users maintain what they can see
6. **Performance requires trade-offs**: Exact vs approximate, real-time vs
   scheduled
7. **Alerts should be actionable**: Every alert should suggest a specific fix
8. **Track maintenance impact**: Show users the value of their cleanup efforts

**Critical Pattern**: Health metrics are not just diagnostics—they're the
foundation for intelligent automation. AI deletion agents use these metrics to
prioritize work and validate outcomes.
