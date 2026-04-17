#!/usr/bin/env bash
set -euo pipefail

VAULT="${1:-}"
DRY_RUN=false
if [ "${2:-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

if [ -z "$VAULT" ]; then
  echo "Usage: $0 /path/to/obsidian-vault [--dry-run]"
  exit 1
fi

echo "Staging notes from vault: $VAULT"
./scripts/obsidian_sync.sh "$VAULT"

BRANCH="obsidian-sync/$(date +%Y%m%d-%H%M%S)"
COMMIT_MSG="obsidian: sync notes from vault @ $(date --iso-8601=seconds)"

if $DRY_RUN; then
  echo "DRY RUN: Would create branch: $BRANCH"
  echo "DRY RUN: Would run: git checkout -b $BRANCH"
  echo "DRY RUN: Would run: git add .github/obsidian-sync/notes && git commit -m \"$COMMIT_MSG\""
  echo "DRY RUN: Would push branch and create PR (via 'gh') if available"
  exit 0
fi

git fetch origin
git checkout -b "$BRANCH"
git add .github/obsidian-sync/notes
git commit -m "$COMMIT_MSG" || { echo "Nothing to commit"; git checkout -; exit 0; }
git push -u origin "$BRANCH"

if command -v gh >/dev/null 2>&1; then
  gh pr create --base main --head "$BRANCH" --title "Obsidian sync $(date +%Y-%m-%d)" --body "Staged notes from Obsidian vault for review."
  echo "PR created via gh CLI."
else
  echo "Branch pushed: $BRANCH"
  echo "Install GitHub CLI (gh) and run: gh pr create --base main --head $BRANCH --title \"Obsidian sync\" --body \"Staged notes from Obsidian vault\""
fi

echo "Done. Review the PR and follow the standard review/merge workflow."
