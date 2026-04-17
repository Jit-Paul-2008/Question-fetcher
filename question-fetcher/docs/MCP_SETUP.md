# MCP Setup (Beginner, Practical)

This project can benefit from MCP connectors, but they require user-side configuration in your VS Code environment.

## What MCP Can Add
- Better Git/GitHub operations
- External docs lookups
- DB/admin automation
- Ticketing or PM system integration

## Minimal MCP Stack to Enable First
1. Git/GitHub MCP
2. Documentation retrieval MCP
3. Database MCP (only if needed)

## How to Enable (Generic Steps)
1. Open VS Code Command Palette.
2. Run command for adding/configuring MCP servers (provider-specific).
3. Add server credentials/tokens in your user-level secure config.
4. Restart VS Code window.
5. Verify server appears in available tools list.

## Security Rules
- Never store MCP tokens in repo files.
- Use OS keychain or secure user config.
- Scope tokens to minimum permissions.

## Handoff Trigger
After MCP is configured in your environment, tell Copilot:

`MCP CONNECTORS READY. RESCAN TOOL ACCESS AND CONTINUE.`

Then Copilot can adapt workflows to the newly available connectors.
