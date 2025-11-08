#!/bin/bash
# Merge upstream Theia updates into Quallaa fork
# This script automates the merge process and handles known conflicts

set -e  # Exit on error

UPSTREAM_BRANCH="${1:-upstream/master}"
MERGE_MSG="Merge upstream Theia updates from ${UPSTREAM_BRANCH}"

echo "============================================"
echo "Quallaa Upstream Merge Script"
echo "============================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a clean state
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: Working directory is not clean.${NC}"
    echo "Please commit or stash your changes before merging."
    git status --short
    exit 1
fi

# Check if upstream remote exists
if ! git remote | grep -q "^upstream$"; then
    echo -e "${RED}Error: 'upstream' remote not found.${NC}"
    echo "Please add the upstream remote:"
    echo "  git remote add upstream https://github.com/eclipse-theia/theia-ide.git"
    exit 1
fi

# Fetch latest upstream changes
echo -e "${BLUE}Fetching upstream changes...${NC}"
git fetch upstream

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# Show what we're merging
echo -e "${BLUE}Merge target: ${UPSTREAM_BRANCH}${NC}"
UPSTREAM_COMMIT=$(git rev-parse ${UPSTREAM_BRANCH})
UPSTREAM_MSG=$(git log --oneline -1 ${UPSTREAM_BRANCH})
echo "Latest upstream commit: ${UPSTREAM_MSG}"
echo ""

# Confirm before proceeding
read -p "Proceed with merge? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Merge cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Starting merge...${NC}"
echo ""

# Attempt the merge (will likely have conflicts)
if git merge ${UPSTREAM_BRANCH} --no-commit --no-ff -m "${MERGE_MSG}"; then
    echo -e "${GREEN}Clean merge! No conflicts detected.${NC}"
    CLEAN_MERGE=true
else
    echo -e "${YELLOW}Conflicts detected. Applying automatic resolution strategies...${NC}"
    CLEAN_MERGE=false
fi

# Auto-resolve files where we always want "ours" (Quallaa-specific)
OURS_FILES=(
    "README.md"
    "CONTRIBUTING.md"
    "LICENSE"
    "NOTICE.md"
    "theia-extensions/product/src/browser/branding-util.tsx"
    "theia-extensions/product/src/browser/theia-ide-about-dialog.tsx"
    "theia-extensions/product/src/browser/theia-ide-getting-started-widget.tsx"
    "theia-extensions/product/src/browser/style/index.css"
    "applications/electron/electron-builder.yml"
)

echo ""
echo -e "${BLUE}Resolving Quallaa-specific files (keeping ours)...${NC}"
for file in "${OURS_FILES[@]}"; do
    if [[ -f "$file" ]] && git status --porcelain | grep -q "^UU.*$file"; then
        echo "  ✓ $file"
        git checkout --ours "$file"
        git add "$file"
    fi
done

# Handle yarn.lock - always regenerate
if git status --porcelain | grep -q "yarn.lock"; then
    echo ""
    echo -e "${BLUE}Resolving yarn.lock (regenerating)...${NC}"
    git checkout --theirs yarn.lock 2>/dev/null || true
    echo "  Running yarn install..."
    yarn install --silent
    git add yarn.lock
    echo -e "${GREEN}  ✓ yarn.lock regenerated${NC}"
fi

# Check for remaining conflicts
REMAINING_CONFLICTS=$(git diff --name-only --diff-filter=U)

echo ""
if [[ -z "$REMAINING_CONFLICTS" ]]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}All conflicts resolved automatically!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Review the changes and commit:"
    echo "  git diff --cached"
    echo "  git commit -m '${MERGE_MSG}'"
    echo ""
else
    echo -e "${YELLOW}============================================${NC}"
    echo -e "${YELLOW}Manual conflict resolution required${NC}"
    echo -e "${YELLOW}============================================${NC}"
    echo ""
    echo "The following files still have conflicts:"
    echo ""
    while IFS= read -r file; do
        echo -e "${YELLOW}  ⚠  $file${NC}"
    done <<< "$REMAINING_CONFLICTS"
    echo ""
    echo -e "${BLUE}Resolution strategies:${NC}"
    echo ""
    echo "For package.json files:"
    echo "  1. Keep Quallaa metadata (name, author, license, homepage, bugs)"
    echo "  2. Accept upstream dependency versions"
    echo "  3. Keep Quallaa-specific dependencies (quallaa-knowledge-base-ext, etc.)"
    echo ""
    echo "For config files (.eslintrc.js, .gitignore):"
    echo "  1. Keep Quallaa additions"
    echo "  2. Accept upstream changes"
    echo "  3. Merge both when possible"
    echo ""
    echo "After resolving conflicts:"
    echo "  git add <resolved-files>"
    echo "  git commit -m '${MERGE_MSG}'"
    echo ""
    echo "To abort the merge:"
    echo "  git merge --abort"
    echo ""
fi

# Show summary of what was merged
echo -e "${BLUE}Upstream commits being merged:${NC}"
git log --oneline HEAD..${UPSTREAM_BRANCH} | head -10
COMMIT_COUNT=$(git log --oneline HEAD..${UPSTREAM_BRANCH} | wc -l | tr -d ' ')
if [[ $COMMIT_COUNT -gt 10 ]]; then
    echo "  ... and $((COMMIT_COUNT - 10)) more commits"
fi
echo ""
