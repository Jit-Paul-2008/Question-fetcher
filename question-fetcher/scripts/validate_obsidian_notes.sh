#!/usr/bin/env bash
set -euo pipefail

NOTES_DIR=".github/obsidian-sync/notes"

if [ ! -d "$NOTES_DIR" ]; then
  echo "Notes directory not found: $NOTES_DIR"
  exit 0
fi

ret=0
for f in "$NOTES_DIR"/*.md; do
  [ -e "$f" ] || continue
  echo "Validating $f"
  # Check frontmatter exists
  if ! sed -n '1,20p' "$f" | grep -q '^---'; then
    echo "ERROR: Missing frontmatter start '---' in $f"
    ret=1
    continue
  fi
  # title
  if ! sed -n '1,50p' "$f" | grep -q '^title:'; then
    echo "ERROR: Missing 'title:' in frontmatter of $f"
    ret=1
  fi
  # type
  if ! sed -n '1,50p' "$f" | grep -q '^type:'; then
    echo "ERROR: Missing 'type:' in frontmatter of $f"
    ret=1
  else
    t=$(sed -n '1,50p' "$f" | sed -n 's/^type:[[:space:]]*//p' | tr -d '\r' | tr -d '"')
    case "$t" in
      policy|decision|update) ;;
      *) echo "ERROR: Invalid type '$t' in $f; allowed: policy, decision, update"; ret=1 ;;
    esac
  fi
  # tags or explicit #chemscan marker
  if ! sed -n '1,200p' "$f" | grep -qi 'chemscan'; then
    echo "ERROR: No 'chemscan' tag or marker found in $f"
    ret=1
  fi
done

if [ $ret -ne 0 ]; then
  echo "Validation failed"
  exit $ret
fi

echo "All notes validated"
exit 0
