#!/usr/bin/env bash
set -euo pipefail

SRC_DIR=".github/obsidian-sync/notes"
VAULT="${1:-}"

usage() {
  cat <<EOF
Usage: $0 /path/to/obsidian-vault

This script copies markdown notes from the repository's
`.github/obsidian-sync/notes` directory into your local
Obsidian vault so you can continue working there.

Run from repository root.
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

if [ ! -d "$SRC_DIR" ]; then
  echo "No notes to export in $SRC_DIR" >&2
  exit 0
fi

echo "Copying notes from $SRC_DIR to $VAULT..."
mkdir -p "$VAULT"
cp -v "$SRC_DIR"/*.md "$VAULT" || true

echo "Export complete. Verify notes in your Obsidian vault."
