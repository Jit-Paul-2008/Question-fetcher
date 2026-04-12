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

Automated PR workflow
- After staging notes with `./scripts/obsidian_sync.sh /path/to/vault`, run:

```bash
./scripts/obsidian_stage_and_pr.sh /path/to/vault --dry-run  # preview
./scripts/obsidian_stage_and_pr.sh /path/to/vault           # create branch, push, PR (requires gh or manual PR)
```

- The repository contains a GitHub Actions workflow `.github/workflows/obsidian-sync-pr.yml` which validates notes (frontmatter) and runs `npm run lint` + `npm run build` on PRs created from `obsidian-sync/*` branches.

Security note: PR creation uses the `gh` CLI if available; otherwise the script pushes a branch and prints the `gh` command to run. Ensure your local git remote and permissions are configured before running the non-dry-run.

Template notes
- See `.github/obsidian-sync/templates` for example frontmatter templates for `decision`, `policy`, and `update` notes.
