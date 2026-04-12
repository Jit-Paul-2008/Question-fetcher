# Vault Watcher (live feed)

Small local service to watch your Obsidian vault (or any directory) and stream file events over Server-Sent Events (SSE).

Usage

1. Install dependencies:

```bash
cd tools/vault-watcher
npm install
```

2. Run the watcher (defaults to current directory and port 3030):

```bash
node index.js --dir . --port 3030
```

3. Open http://localhost:3030 in a browser to see a live feed of file adds/changes/deletes.

Notes

- The watcher ignores `.git`, `node_modules`, `dist`, `build`, and `.obsidian/plugins` by default.
- Events include a short snippet for Markdown/Text/JSON files.
- You can integrate the SSE endpoint (`/events`) with your own dashboard or a simple EventSource client.
