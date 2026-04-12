#!/usr/bin/env bash
set -euo pipefail

VAULT="${1:-}"
DEST_DIR=".github/obsidian-sync/notes"

usage() {
  cat <<EOF
Usage: $0 /path/to/obsidian-vault

This script copies Obsidian notes tagged with #chemscan into
`.github/obsidian-sync/notes` for review and manual application.

Notes:
 - Add the tag `#chemscan` to any note you want synced.
 - The script only copies files; it does not modify canonical files.
EOF
}

if [ -z "$VAULT" ]; then
  usage
  exit 1
fi

if [ ! -d "$VAULT" ]; then
  echo "Vault not found: $VAULT" >&2
  exit 2
fi

mkdir -p "$DEST_DIR"

# Find markdown files that contain the tag #chemscan (case-insensitive)
mapfile -t files < <(grep -RIl --include='*.md' "#chemscan" "$VAULT" 2>/dev/null || true)

if [ "${#files[@]}" -eq 0 ]; then
  echo "No notes found with #chemscan tag in $VAULT"
  exit 0
fi

echo "Found ${#files[@]} notes; copying to $DEST_DIR..."

for f in "${files[@]}"; do
  cp "$f" "$DEST_DIR/$(basename "$f")"
done

echo "Copy complete. Files in $DEST_DIR:"
ls -la "$DEST_DIR"

echo "Review the files in $DEST_DIR and apply them to canonical locations as needed."
