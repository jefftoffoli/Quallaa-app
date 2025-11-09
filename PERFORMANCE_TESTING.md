# Performance Testing Results

## Overview

This document tracks performance testing infrastructure and results for Quallaa
with 1000+ note workspaces.

**Date:** 2025-11-08 **Test Workspace:** 1000 notes with ~5 wiki links each
**Total Workspace Size:** ~3.4MB

---

## Test Infrastructure

### Workspace Generator

**Script:** `scripts/generate-perf-workspace.ts`

Generates configurable test workspaces with realistic content:

- Configurable note count (default: 1000)
- Configurable wiki links per note (default: 5)
- Realistic content (100-2000 words)
- Frontmatter with title, date, and hierarchical tags
- Multiple sections: Overview, Related Notes, Key Points, Details, References

**Usage:**

```bash
# Generate 1000-note workspace
npx ts-node scripts/generate-perf-workspace.ts -c 1000 -o perf-workspace

# Generate 100-note workspace for quick testing
npx ts-node scripts/generate-perf-workspace.ts -c 100 -o perf-workspace-small
```

### Performance Benchmark Tests

**File:** `applications/browser/test/performance.spec.ts`

8 comprehensive performance tests covering:

1. Workspace indexing (target: <10s for 1K notes)
2. Knowledge graph rendering (target: <5s for 1K nodes)
3. Wiki link autocomplete (target: <50ms)
4. Note search (target: <100ms)
5. File change detection (target: <100ms)
6. Graph interactions - zoom/pan (target: <200ms)
7. Tags browser scalability (target: <2s)
8. Performance summary

**Running Tests:**

```bash
# Run with perf-workspace
TEST_WORKSPACE=perf-workspace npx playwright test applications/browser/test/performance.spec.ts

# Run with smaller workspace
TEST_WORKSPACE=perf-workspace-small npx playwright test applications/browser/test/performance.spec.ts
```

---

## Initial Test Run Results (2025-11-08)

**Configuration:**

- Workspace: 1000 notes
- Average links per note: 5
- Browser: Headless = false
- Workers: 1 (sequential)

**Test Execution Times:**

| Test                     | Duration       | Status    | Notes                                |
| ------------------------ | -------------- | --------- | ------------------------------------ |
| 1. Indexing              | 7.2s           | ⚠️ Failed | Command palette did not open         |
| 2. Graph Rendering       | 21.8s          | ⚠️ Failed | Command palette did not open         |
| 3. Autocomplete          | 2.0m (timeout) | ⚠️ Failed | Test timeout - likely waiting for UI |
| 4. Note Search           | 22.1s          | ⚠️ Failed | Command palette did not open         |
| 5. File Change Detection | 22.3s          | ⚠️ Failed | Command palette did not open         |
| 6. Graph Interactions    | 21.9s          | ⚠️ Failed | Command palette did not open         |
| 7. Tags Browser          | 21.8s          | ⚠️ Failed | Command palette did not open         |
| 8. Summary               | 1.7s           | ✅ Passed | No UI interaction required           |

**Total Runtime:** 4.2 minutes

### Root Cause Analysis

All 7 failing tests encountered the same issue:

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('.monaco-quick-input-box input') to be visible
```

**Cause:** The Getting Started widget is blocking focus, preventing the command
palette (F1) from opening.

**Evidence:**

```
2025-11-09T00:26:24.215Z root WARN Widget was activated, but did not accept focus after 2000ms: getting.started.widget
```

This warning appears repeatedly in the test output.

---

## Action Items

### High Priority

1. **Fix Getting Started Widget Interference**
    - Close/hide Getting Started widget in test setup
    - Add to `beforeEach` hook:
        ```typescript
        // Close Getting Started widget if present
        const gettingStartedClose = page.locator(
            '.getting-started-widget .codicon-close'
        );
        if (await gettingStartedClose.isVisible()) {
            await gettingStartedClose.click();
        }
        ```

2. **Re-run Performance Tests**
    - After fixing widget issue
    - Collect actual performance metrics
    - Compare against targets in Next Steps.md

### Medium Priority

3. **Analyze Performance Bottlenecks**
    - Initial test durations (~20s each) suggest possible overhead
    - Investigate if 15-second indexing wait is sufficient
    - Check if UI interactions are slower than expected

4. **Optimize Test Execution**
    - Current total runtime: 4.2 minutes
    - Consider parallelization where appropriate
    - Add progress indicators for long-running tests

### Low Priority

5. **Expand Test Coverage**
    - Add memory usage monitoring
    - Add CPU usage monitoring
    - Test with 5K and 10K note workspaces
    - Add stress tests (rapid file changes, multiple graphs open)

6. **Create Performance Dashboard**
    - Track metrics over time
    - Visualize performance trends
    - Set up automated performance regression detection

---

## Performance Targets (from Next Steps.md Phase 10)

| Metric                     | Target | Status            |
| -------------------------- | ------ | ----------------- |
| Indexing (100 notes)       | <1s    | ⏳ Not tested yet |
| Indexing (1000 notes)      | <10s   | ⏳ Not tested yet |
| Graph rendering (1K nodes) | <5s    | ⏳ Not tested yet |
| Autocomplete               | <50ms  | ⏳ Not tested yet |
| Search                     | <100ms | ⏳ Not tested yet |
| File change detection      | <100ms | ⏳ Not tested yet |
| Graph interactions         | <200ms | ⏳ Not tested yet |
| Tags browser load          | <2s    | ⏳ Not tested yet |

**Note:** All targets are currently untested due to test infrastructure issue.

---

## Next Steps

1. ✅ Create workspace generator → **COMPLETE**
2. ✅ Create performance benchmark tests → **COMPLETE**
3. ✅ Run initial performance test suite → **COMPLETE**
4. ⏳ Fix Getting Started widget interference → **NEXT**
5. ⏳ Re-run tests and collect metrics → **BLOCKED**
6. ⏳ Analyze results and identify bottlenecks → **BLOCKED**
7. ⏳ Document actual vs. target performance → **BLOCKED**
8. ⏳ Create optimization recommendations → **BLOCKED**

---

## Workspace Details

### Generated 1000-Note Workspace

**Location:** `perf-workspace/`

**Statistics:**

- Total notes: 1000
- Generation time: 0.12s
- Average file size: ~3.4KB
- Total size: ~3.4MB
- Tags: Mix of single-level and hierarchical (e.g., `project/backend`)
- Wiki links: ~5000 total (5 per note average)

**Sample Note Structure:**

```markdown
---
title: Exploring User Experience 1
date: 2025-11-08
tags:
    - archive/backend
    - research/frontend
---

# Exploring User Experience 1

## Overview

Modern Database Architecture practices emphasize security...

## Related Notes

- [[Note 43]]
- [[Note 30]]
- [[Note 38]]

## Key Points

- This approach focuses on Agile Methodologies...
```

---

## Commit History

- **75d8722**: feat: add performance testing infrastructure
    - Workspace generator script (1K+ configurable notes)
    - 8 performance benchmark tests
    - Playwright config with webServer and TEST_WORKSPACE env var
    - Updated .gitignore to exclude generated workspaces

---

## Additional Notes

### Known Issues

1. **Getting Started Widget:** Blocks command palette in tests
    - **Workaround:** Manually close before each test
    - **Permanent fix:** Disable in test configuration

2. **Test Timeouts:** Autocomplete test hit 120s timeout
    - **Likely cause:** Waiting for UI element that never appears
    - **Fix required:** Close Getting Started widget first

### Observations

- Workspace generation is very fast (0.12s for 1000 notes)
- Test infrastructure successfully starts app with custom workspace
- Playwright webServer integration works correctly
- All tests follow consistent pattern but blocked by UI issue

### Future Enhancements

- Add performance regression detection
- Integrate with CI/CD pipeline
- Create performance comparison reports
- Add flame graphs for profiling
- Monitor memory leaks during long sessions
- Test with different workspace sizes (100, 500, 1K, 5K, 10K notes)
