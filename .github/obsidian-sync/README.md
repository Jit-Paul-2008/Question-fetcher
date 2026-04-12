Obsidian Sync for ChemScan

This folder supports a simple, review-first sync from an Obsidian vault into the repository.

Workflow
- Tag notes you want to sync with `#chemscan` in Obsidian.
- Run `./scripts/obsidian_sync.sh /path/to/your/vault` from the repo root.
- Files matching the tag are copied into `.github/obsidian-sync/notes` for review.
- Manually review and merge or apply changes to canonical locations like `.github/prompts` or `.github/instructions`.

Why review-first?
- Prevents accidental overwrite of canonical policy files.
- Gives an explicit audit trail: notes are staged into `.github/obsidian-sync/notes`.

Optional automations
- Use the Obsidian Git community plugin to commit/ push notes to a remote repo, then use CI or a maintainer workflow to apply changes.
- Create a second script to auto-apply specific note types (only recommended with strict review gating).

Template notes
- See `.github/obsidian-sync/templates` for example frontmatter templates for `decision`, `policy`, and `update` notes.
