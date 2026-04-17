#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=true
if [ "${1:-}" = "--apply" ]; then
  DRY_RUN=false
fi

node scripts/obsidian_parser.js

PREP_DIR=".github/obsidian-sync/for-apply"
if [ ! -d "$PREP_DIR" ]; then
  echo "Nothing prepared to apply. Run parser first or stage notes." >&2
  exit 1
fi

BRANCH="obsidian-apply/$(date +%Y%m%d-%H%M%S)"
MSG="obsidian: apply prepared notes @ $(date --iso-8601=seconds)"

if $DRY_RUN; then
  echo "DRY RUN: prepared files in $PREP_DIR"
  find "$PREP_DIR" -type f -maxdepth 3 -print
  echo "To apply: run ./scripts/obsidian_apply.sh --apply"
  exit 0
fi

git fetch origin
git checkout -b "$BRANCH"

# Copy prepared files into repo root
cp -r .github/obsidian-sync/for-apply/* ./
git add .
git commit -m "$MSG" || { echo "Nothing to commit"; git checkout -; exit 0; }
git push -u origin "$BRANCH"

if command -v gh >/dev/null 2>&1; then
  gh pr create --base main --head "$BRANCH" --title "Obsidian apply $(date +%Y-%m-%d)" --body "Applying prepared notes from Obsidian (review required)."
  echo "PR created via gh CLI."
else
  echo "Branch pushed: $BRANCH"
  echo "Use 'gh pr create' or open a PR from the branch in GitHub UI."
fi

echo "Apply complete. Review changes in PR."
