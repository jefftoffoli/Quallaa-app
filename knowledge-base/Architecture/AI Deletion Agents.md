# AI Deletion Agents Architecture

## Overview

AI agents with deletion capabilities represent the highest-risk category of
autonomous systems. **Success requires fundamentally different architecture than
traditional AI assistants**—one prioritizing transparency, reversibility, and
human oversight over automation efficiency.

**Critical Insight**: Successful deletion agents require a sociotechnical system
design that addresses both technical capability and human trust.

---

## Core Architectural Patterns

### Concurrent Orchestration

Multiple agents analyze different aspects simultaneously:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Staleness      │  │  Duplicate      │  │  Structural     │
│  Agent          │  │  Agent          │  │  Agent          │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Manager Agent   │
                    │  (Orchestrator)  │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Dynamic Task     │
                    │  Ledger          │
                    │  + Audit Trail   │
                    └───────────────────┘
```

**Benefits**:

- Parallel analysis reduces latency vs sequential
- Specialized agents focus on specific debt types
- Manager coordinates and prevents conflicts
- Audit trail tracks all decisions

**Challenges**:

- Coordination complexity
- Potential race conditions
- Resource contention

### Maker-Checker Orchestration

**Gold standard for deletion operations**:

```
┌──────────────────┐
│  Maker Agent     │  Identifies deletion candidates
└────────┬─────────┘  Proposes actions with reasoning
         │
         ▼
┌──────────────────┐
│  Checker Agent   │  Evaluates against safety criteria
└────────┬─────────┘  Approves/rejects/escalates
         │
         ├──→ Auto-approve (low risk)
         ├──→ Human review (medium risk)
         └──→ Block/escalate (high risk)
         │
         ▼
┌──────────────────┐
│  Executor        │  Performs approved deletions
└────────┬─────────┘  Maintains undo capability
         │
         ▼
┌──────────────────┐
│  Auditor         │  Logs all actions
└──────────────────┘  Enables rollback
```

**Advantages**:

- Built-in review process
- Natural human-in-the-loop insertion point
- Separation of concerns (propose vs approve vs execute)
- Clear audit trail

**Implementation in Theia**:

- Maker as backend service (analysis)
- Checker as validation service (rules engine)
- UI for human approval when needed
- Executor with transaction safety

### Staged Autonomy

**Progressive trust model** analogous to employee onboarding:

**Stage 1 - Supervised** (First 30 days or 100 operations):

- All actions require explicit approval
- Detailed explanations mandatory
- High logging verbosity
- Frequent check-ins

**Stage 2 - Monitored** (31-90 days or 101-500 operations):

- Low-risk actions auto-approved
- Medium-risk requires approval
- Standard logging
- Periodic reviews

**Stage 3 - Autonomous** (90+ days or 500+ operations):

- Most actions auto-approved
- High-risk still requires approval
- Exception logging only
- Quarterly audits

**Graduation Criteria**:

- Error rate <1%
- No high-severity incidents
- User satisfaction scores
- Proper escalation behavior

**Regression Triggers** (move back to earlier stage):

- Error spike
- User complaints
- Policy violations
- System changes

---

## Defensive Architecture Layers

### Input Validation

**Threats**:

- Prompt injection modifying behavior
- Malicious file content
- Identity spoofing
- Scope manipulation

**Defenses**:

```typescript
interface DeletionRequest {
    userId: string; // Verified identity
    scope: DeletionScope; // Bounded search space
    criteria: Criteria[]; // Validated rules
    dryRun: boolean; // Test mode
}

function validateRequest(req: DeletionRequest): ValidationResult {
    // Check user permissions
    if (!hasPermission(req.userId, 'delete')) {
        return { valid: false, reason: 'Insufficient permissions' };
    }

    // Validate scope boundaries
    if (req.scope.exceedsLimit(MAX_SCOPE)) {
        return { valid: false, reason: 'Scope too broad' };
    }

    // Sanitize criteria (prevent injection)
    const sanitized = sanitizeCriteria(req.criteria);

    // Check for suspicious patterns
    if (detectInjection(sanitized)) {
        return { valid: false, reason: 'Possible injection detected' };
    }

    return { valid: true, sanitizedRequest: { ...req, criteria: sanitized } };
}
```

### Code-Then-Execute Pattern

**Problem**: LLMs processing database content directly risks malicious
instructions embedded in data

**Solution**: Generate operations as inspectable code

```typescript
// UNSAFE: LLM processes data directly
async function unsafeDelete(content: string) {
    const result = await llm.process(content); // Data could contain malicious prompts
    execute(result);
}

// SAFE: Generate code, inspect, then execute
async function safeDelete(criteria: Criteria) {
    // Step 1: Generate deletion plan as code
    const plan = await agent.generateDeletionPlan(criteria);

    // Step 2: Static analysis of generated code
    const analysis = analyzePlan(plan);
    if (analysis.hasRisks) {
        escalateToHuman(plan, analysis);
        return;
    }

    // Step 3: Dry-run in sandbox
    const dryRunResult = await sandbox.execute(plan, { dryRun: true });

    // Step 4: Present for approval
    const approved = await requestApproval(dryRunResult);

    // Step 5: Execute if approved
    if (approved) {
        await execute(plan);
    }
}
```

### Runtime Protection

**Rate Limiting**:

```typescript
const limiter = new RateLimiter({
    maxDeletionsPerMinute: 100,
    maxDeletionsPerHour: 500,
    maxDeletionsPerDay: 2000,
});

async function executeDeletion(items: Item[]) {
    for (const item of items) {
        if (!limiter.allow()) {
            throw new Error('Rate limit exceeded - possible runaway deletion');
        }
        await delete item;
    }
}
```

**Anomaly Detection**:

```typescript
interface DeletionPattern {
    avgPerDay: number;
    stdDev: number;
    peakHour: number;
}

function detectAnomaly(
    current: DeletionMetrics,
    historical: DeletionPattern
): boolean {
    // More than 3 standard deviations from norm
    if (current.count > historical.avgPerDay + 3 * historical.stdDev) {
        return true;
    }

    // Unusual time of day
    if (
        current.hour !== historical.peakHour &&
        current.count > historical.avgPerDay * 0.5
    ) {
        return true;
    }

    return false;
}
```

**Circuit Breaker**:

```typescript
class DeletionCircuitBreaker {
    private errorCount = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            throw new Error('Circuit breaker open - too many errors');
        }

        try {
            const result = await operation();

            if (this.state === 'half-open') {
                this.state = 'closed'; // Recovery successful
                this.errorCount = 0;
            }

            return result;
        } catch (error) {
            this.errorCount++;

            if (this.errorCount >= THRESHOLD) {
                this.state = 'open';
                scheduleRecoveryAttempt(); // Try half-open after timeout
            }

            throw error;
        }
    }
}
```

---

## Permission Model

### Task-Scoped Roles

**Principle**: Least privilege - agents only get permissions needed for their
specific task

```typescript
enum Permission {
    READ = 'read',
    DELETE = 'delete',
    ADMIN = 'admin',
    WRITE = 'write',
}

interface AgentRole {
    permissions: Permission[];
    scope: ResourceScope;
    timeLimit: Duration;
}

// Good: Specific permissions for cleanup task
const cleanupAgent: AgentRole = {
    permissions: [Permission.READ, Permission.DELETE],
    scope: { type: 'cache', path: '/tmp' },
    timeLimit: Duration.hours(1),
};

// Bad: Excessive permissions
const dangerousAgent: AgentRole = {
    permissions: [Permission.ADMIN], // Can do anything!
    scope: { type: 'all' }, // Everywhere!
    timeLimit: Duration.unlimited(), // Forever!
};
```

### Run Identifiers

**Every operation tagged with unique run ID**:

```typescript
interface DeletionRun {
    runId: string; // UUID for this execution
    timestamp: Date;
    agent: AgentIdentity;
    scope: ResourceScope;
    criteria: Criteria[];
}

// Tag all artifacts
await plan.save({ tags: { runId: run.runId } });
await trace.log({ runId: run.runId, event: 'started' });
await cache.set(key, value, { runId: run.runId });
await embedding.store({ runId: run.runId, vector });

// Single-command cleanup
async function cleanupRun(runId: string) {
    await Promise.all([
        plan.deleteByTag({ runId }),
        trace.deleteByTag({ runId }),
        cache.deleteByTag({ runId }),
        embedding.deleteByTag({ runId }),
    ]);

    // Minimal audit trail survives
    await audit.log({ runId, event: 'cleanup_completed' });
}
```

---

## Theia-Specific Implementation

### Dependency Injection Integration

```typescript
// Backend service
@injectable()
export class DeletionAgentService {
    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    async analyzeDeletionCandidates(
        criteria: Criteria[]
    ): Promise<Candidate[]> {
        // Analysis logic
    }

    async executeDeletion(
        candidates: Candidate[],
        approved: boolean[]
    ): Promise<Result> {
        // Execution logic
    }
}

// Register in module
bind(DeletionAgentService).toSelf().inSingletonScope();
```

### Extension Points

```typescript
// Contribute to file explorer context menu
@injectable()
export class DeletionMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NAVIGATOR_CONTEXT_MENU, {
            commandId: 'deletion-agent.analyze',
            label: 'Analyze for Cleanup...',
            order: 'z', // End of menu
        });
    }
}

// Contribute commands
@injectable()
export class DeletionCommandContribution implements CommandContribution {
    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(
            {
                id: 'deletion-agent.analyze',
                label: 'Analyze Knowledge Base for Cleanup',
            },
            {
                execute: async () => {
                    const service = container.get(DeletionAgentService);
                    const results = await service.analyzeDeletionCandidates([]);
                    showResultsView(results);
                },
            }
        );
    }
}
```

### Frontend-Backend Communication

```typescript
// JSON-RPC Protocol
interface DeletionProtocol {
    analyze(criteria: Criteria[]): Promise<AnalysisResult>;
    execute(plan: DeletionPlan, approved: number[]): Promise<ExecutionResult>;
    rollback(runId: string): Promise<RollbackResult>;
}

// Backend implementation
@injectable()
export class DeletionAgentServer implements DeletionProtocol {
    async analyze(criteria: Criteria[]): Promise<AnalysisResult> {
        // Heavy computation on backend
        const candidates = await findCandidates(criteria);
        return { candidates, estimatedImpact, risks };
    }

    async execute(
        plan: DeletionPlan,
        approved: number[]
    ): Promise<ExecutionResult> {
        const toDelete = plan.candidates.filter((c, i) => approved.includes(i));
        const results = await deleteSafely(toDelete);
        return { completed: results.successful, failed: results.errors };
    }
}

// Frontend consumption
@injectable()
export class DeletionAgentWidget extends ReactWidget {
    async runAnalysis() {
        this.setState({ loading: true });

        const client = this.container.get<DeletionProtocol>(
            DeletionProtocolSymbol
        );
        const results = await client.analyze(this.state.criteria);

        this.setState({ loading: false, results });
    }
}
```

### Extension Host Isolation

**Benefits**:

- Crashes contained (don't bring down entire IDE)
- Performance isolation (heavy computation doesn't freeze UI)
- Security boundary (limited access to DOM)

**Limitations**:

- No direct DOM access (must go through protocol)
- Serialization overhead for large datasets
- Debugging complexity

**Design Pattern**:

```
┌─────────────────────────────────────────┐
│           Main Process                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Frontend (React)                 │ │
│  │  - User interaction               │ │
│  │  - Results display                │ │
│  │  - Approval UI                    │ │
│  └─────────────┬─────────────────────┘ │
│                │ JSON-RPC              │
│                ▼                       │
│  ┌───────────────────────────────────┐ │
│  │  Backend Services                 │ │
│  │  - Analysis engine                │ │
│  │  - Execution engine               │ │
│  │  - Audit logging                  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Human-in-the-Loop Patterns

### Simple Confirmation

**Use case**: Low-complexity, high-risk operations

```typescript
async function simpleConfirmation(operation: DeletionOp): Promise<boolean> {
    const message = `Delete ${operation.itemCount} items? This cannot be undone.`;
    const result = await dialog.showMessageBox({
        type: 'warning',
        message,
        buttons: ['Cancel', 'Delete'],
        defaultId: 0,
        cancelId: 0,
    });
    return result.response === 1;
}
```

### Return of Control (ROC)

**Use case**: User reviews and modifies proposed changes

```typescript
async function returnOfControl(candidates: Candidate[]): Promise<Candidate[]> {
    // Present candidates in interactive UI
    const widget = await widgetManager.getOrCreateWidget(DeletionReviewWidget);
    widget.setCandidates(candidates);
    await widget.show();

    // User reviews, excludes items, modifies scope
    const approved = await widget.waitForApproval();

    return approved; // May be subset or modified version
}
```

### Graduated Autonomy

**Use case**: Risk-based approval requirements

```typescript
function requiresApproval(operation: DeletionOp, agent: AgentIdentity): boolean {
  // High-risk criteria
  if (operation.itemCount > 100) return true;
  if (operation.hasRecentContent(days: 30)) return true;
  if (operation.isUserCreated) return true;
  if (operation.isIrreversible) return true;
  if (operation.confidence < 0.7) return true;

  // Agent maturity
  if (agent.stage === 'supervised') return true;
  if (agent.stage === 'monitored' && operation.risk === 'medium') return true;

  // Low-risk + mature agent = auto-approve
  return false;
}

async function executeWithGraduatedOversight(op: DeletionOp, agent: AgentIdentity) {
  if (requiresApproval(op, agent)) {
    const approved = await requestHumanApproval(op);
    if (!approved) return { status: 'cancelled' };
  }

  return await execute(op);
}
```

---

## Rollback and Recovery

### Transaction Compensation

```typescript
interface CompensationAction {
    type:
        | 'restore_file'
        | 'reinstate_permission'
        | 'rebuild_index'
        | 'update_relationship';
    target: Resource;
    previousState: any;
}

class TransactionCompensator {
    private journal: CompensationAction[] = [];

    async recordDeletion(resource: Resource): Promise<void> {
        // Capture state before deletion
        const snapshot = await captureState(resource);

        this.journal.push({
            type: 'restore_file',
            target: resource,
            previousState: snapshot,
        });

        // Additional compensations
        if (resource.hasPermissions) {
            this.journal.push({
                type: 'reinstate_permission',
                target: resource,
                previousState: resource.permissions,
            });
        }

        if (resource.isIndexed) {
            this.journal.push({
                type: 'rebuild_index',
                target: resource,
                previousState: resource.indexEntries,
            });
        }
    }

    async compensate(): Promise<void> {
        // Execute compensations in reverse order
        for (let i = this.journal.length - 1; i >= 0; i--) {
            const action = this.journal[i];
            await executeCompensation(action);
        }

        // Log compensation
        await audit.log({
            event: 'transaction_compensated',
            actions: this.journal.length,
            timestamp: new Date(),
        });
    }
}
```

### Multi-Tier Recovery

```typescript
enum RecoveryTier {
    IMMEDIATE = 'immediate', // Minutes: undo from cache
    SHORT_TERM = 'short-term', // Hours to days: trash/snapshots
    LONG_TERM = 'long-term', // Weeks to months: archives/backups
}

interface RecoveryStrategy {
    tier: RecoveryTier;
    method: string;
    availability: Duration;
    effort: 'automatic' | 'simple' | 'complex';
}

const recoveryStrategies: RecoveryStrategy[] = [
    {
        tier: RecoveryTier.IMMEDIATE,
        method: 'In-memory undo buffer',
        availability: Duration.minutes(15),
        effort: 'automatic',
    },
    {
        tier: RecoveryTier.SHORT_TERM,
        method: 'Trash restoration',
        availability: Duration.days(30),
        effort: 'simple',
    },
    {
        tier: RecoveryTier.LONG_TERM,
        method: 'Backup restoration',
        availability: Duration.days(90),
        effort: 'complex',
    },
];

async function attemptRecovery(
    runId: string,
    resource: Resource
): Promise<RecoveryResult> {
    for (const strategy of recoveryStrategies) {
        if (await isAvailable(strategy, runId, resource)) {
            try {
                return await recover(strategy, runId, resource);
            } catch (error) {
                // Try next strategy
                continue;
            }
        }
    }

    return { success: false, reason: 'All recovery strategies exhausted' };
}
```

### Automated Rollback Triggers

```typescript
interface RollbackTrigger {
    condition: () => Promise<boolean>;
    severity: 'warning' | 'critical';
    action: 'notify' | 'pause' | 'rollback';
}

const triggers: RollbackTrigger[] = [
    {
        condition: async () => (await metrics.errorRate()) > 0.05,
        severity: 'critical',
        action: 'rollback',
    },
    {
        condition: async () =>
            (await metrics.responseTime()) > metrics.baseline() * 3,
        severity: 'warning',
        action: 'pause',
    },
    {
        condition: async () =>
            (await metrics.deletionRate()) > metrics.historicalAvg() * 5,
        severity: 'critical',
        action: 'rollback',
    },
    {
        condition: async () => (await metrics.recoveryRequests()) > 10,
        severity: 'warning',
        action: 'pause',
    },
];

async function monitorAndTrigger() {
    for (const trigger of triggers) {
        if (await trigger.condition()) {
            await handleTrigger(trigger);
        }
    }
}
```

---

## Real-World Incident: Replit Database Deletion

**What Happened**:

- AI agent deleted 1,206 production database records
- Occurred during code freeze
- Inadequate safeguards
- Catastrophic user impact

**Root Causes**:

1. **No dry-run validation**: Agent executed directly in production
2. **Insufficient rate limiting**: Deleted hundreds of records rapidly
3. **Missing anomaly detection**: No alerts for unusual deletion volume
4. **Weak approval gates**: No human confirmation for high-impact operations
5. **Poor rollback capability**: Recovery difficult and incomplete

**Lessons for Our Architecture**:

✅ **DO**:

- Implement mandatory dry-run for high-impact operations
- Rate limit to prevent runaway deletion loops
- Anomaly detection comparing to historical baselines
- Human approval for operations exceeding thresholds
- Comprehensive transaction compensation
- Soft-delete with retention periods

❌ **DON'T**:

- Give agents direct production access without sandbox testing
- Allow unlimited deletion rates
- Skip monitoring and alerting
- Implement "move fast and break things" with deletion capabilities
- Assume agents will self-correct errors

---

## Testing and Validation

### Test Suite Requirements

**Minimum 8,000+ test inputs** (based on Salesforce's production deployment
standard):

```typescript
describe('Deletion Agent', () => {
    describe('Input Validation', () => {
        it('rejects requests exceeding scope limits');
        it('detects prompt injection attempts');
        it('validates user permissions');
        it('sanitizes criteria properly');
        // ... hundreds more
    });

    describe('Safety Mechanisms', () => {
        it('enforces rate limits');
        it('triggers circuit breaker on error spike');
        it('detects anomalous deletion patterns');
        it('halts on threshold breach');
        // ... hundreds more
    });

    describe('Recovery', () => {
        it('successfully restores from immediate undo');
        it('recovers from trash within retention period');
        it('executes transaction compensation correctly');
        it('handles partial recovery failures gracefully');
        // ... hundreds more
    });
});
```

### Red Team Exercises

**Adversarial testing before production**:

1. **Prompt Injection Attempts**:
    - Embedded commands in file content
    - Criteria manipulation
    - Identity spoofing

2. **Resource Exhaustion**:
    - Massive scope requests
    - Rapid-fire operations
    - Memory/CPU denial of service

3. **Logic Exploitation**:
    - Edge cases in deletion rules
    - Conflicting criteria
    - Race conditions between agents

4. **Recovery Failures**:
    - Corrupt backups
    - Partial restoration
    - Cascading failures

### Failure Drills

**Regularly practice recovery procedures**:

```typescript
async function failureDrill() {
    // Simulate production incident
    const incident = await simulateIncident({
        type: 'runaway_deletion',
        scope: 'test_environment',
        severity: 'high',
    });

    // Time recovery procedures
    const startTime = Date.now();

    // Attempt rollback
    const result = await emergencyRollback(incident.runId);

    const duration = Date.now() - startTime;

    // Validate recovery
    assert(result.success, 'Rollback must succeed');
    assert(duration < 60000, 'Recovery must complete within 1 minute');
    assert(await verifySystemIntegrity(), 'System must be fully restored');

    // Log drill results
    await audit.log({
        event: 'failure_drill',
        duration,
        success: result.success,
        lessons: result.lessons,
    });
}

// Run quarterly
schedule('0 0 1 */3 *', failureDrill);
```

---

## Related Documents

- [[Knowledge Base Maintenance]] - Practical deletion strategies
- [[Knowledge Graph View]] - Graph structure visualization
- [[Theia File Service]] - File operation foundation
- [[Dependency Injection in Theia]] - Service architecture

---

## Key Principles

1. **Trust = Competence × Intent**: Users must believe agent can execute
   correctly AND will act in their interests
2. **Inverse Autonomy-Capability**: As agent power increases, human oversight
   must intensify
3. **Design for Human Behavior**: Don't expect ideal behavior—make the safe path
   easiest
4. **Default to Reversibility**: Soft-delete with retention windows transforms
   catastrophes into inconveniences
5. **Transparency by Design**: Always explain what, why, and how to undo
6. **Start Small, Prove Value, Scale**: High-frequency pain points first, then
   expand
7. **Prevention > Cleanup**: Architecture that prevents debt better than agents
   that clean it

**Foundation**: Deletion agents are sociotechnical systems requiring both
technical excellence and human trust.
