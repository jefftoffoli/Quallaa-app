# Git Workflow Strategies

**Current Decision:** Direct to master (now) → Feature branches (Phase 1.2+). See [[Decisions Summary]].

## Quick Reference

**Your Fork:** github.com/jefftoffoli/Quallaa-app (branch: master)
**Upstream:** github.com/eclipse-theia/theia (branch: master)

**Now (Knowledge Base Phase):**
```bash
git add knowledge-base/
git commit -m "docs: update decisions"
git push origin master  # YOUR fork
```

**Phase 1.2+ (Implementation):**
```bash
git checkout -b feature/wiki-links
git commit -m "feat(wiki-links): add completion provider"
git push origin feature/wiki-links
# Open PR, merge to YOUR master
```

## Workflow Options

### Direct to Master
- ✅ Using now for knowledge base work
- Commit directly, no branches
- Fast iteration, simple

### Feature Branches
- Use starting Phase 1.2 (implementation)
- Branch per feature: `feature/wiki-links`
- Merge to master when working
- Keep branches short-lived (1-3 days)

### Full PR Workflow
- Add for Beta+ (multiple contributors)
- Require reviews, CI checks
- Protected master branch

---

## Upstream Theia Updates

```bash
# Setup (once)
git remote add upstream https://github.com/eclipse-theia/theia.git

# Sync periodically (every 1-2 months)
git checkout master
git pull upstream master
# Test thoroughly, fix breaking changes
```

---

## Branch Naming

- `feature/wiki-links` - New functionality
- `bugfix/graph-crash` - Fix existing
- `hotfix/electron-crash` - Urgent
- `docs/architecture` - Documentation
- `refactor/file-service` - Code cleanup
- `chore/update-deps` - Build/tooling

---

## Commit Messages

**Format:** `<type>(<scope>): <subject>`

**Types:** feat, fix, docs, refactor, test, chore

**Examples:**
- `feat(wiki-links): add autocomplete for [[ syntax`
- `fix(graph): prevent crash on empty workspace`
- `docs(kb): update decisions summary`

---

## CI/CD

Add GitHub Actions for Phase 2 (feature branches):
- Run on push to master and PRs
- Build, test, lint
- Block merge if failing

---

## Decision Status

✅ **Approved:** Direct to master now, feature branches Phase 1.2+

**Transition trigger:** Start of wiki links implementation
