# Opticwise MCP Servers

Custom Model Context Protocol (MCP) servers used by the Opticwise project so
Cursor can talk directly to our data sources. Configured via
`.cursor/mcp.json` at the repo root.

> The real `.cursor/mcp.json` contains secrets and is **gitignored**.
> See `.cursor/mcp.example.json` for the shared template.

## Servers

| Name | Transport | Source | Notes |
|---|---|---|---|
| `opticwise-postgres` | npx `postgresql-mcp` | https://github.com/bleeding-gums/postgresql-mcp | Connects as `mcp_readonly` — SELECT only |
| `opticwise-pinecone` | npx `@pinecone-database/mcp` | https://github.com/pinecone-io/pinecone-mcp | Official Pinecone MCP |
| `opticwise-slack` | npx `slack-mcp-server` | https://github.com/korotovsky/slack-mcp-server | Bot-token mode (`xoxb-`) — sees only invited channels |
| `opticwise-fathom` | local Node (`mcp-servers/fathom/`) | this repo | Wraps `https://api.fathom.ai/external/v1` |
| `opticwise-gdrive` | local Node (`mcp-servers/gdrive/`) | this repo | Service-account auth via `credentials.json` |

## Setup notes

### Postgres
The read-only role `mcp_readonly` was created on the production Render Postgres
on 2026-05-08. Privileges: `CONNECT`, `USAGE` on `public`, `SELECT` on all
existing and future tables. Writes are blocked. Re-run
`mcp-servers/scripts/create-readonly-pg-role.sql` (or the Node script in
`/tmp/mcp-pg-setup/create-readonly.js`) to rotate the password.

### Slack
The bundled bot token (`xoxb-...`) only allows access to channels the
Opticwise Slack bot is invited to. The MCP server runs in safe mode by default
— `conversations_add_message` and `reactions_add` are disabled unless
`SLACK_MCP_ADD_MESSAGE_TOOL` is set to the channel IDs you want to allow
posting in. To enable posting in `#general`:

```json
"SLACK_MCP_ADD_MESSAGE_TOOL": "C01234567"
```

For broader visibility (search across all channels, DMs, etc.) swap the bot
token for a user OAuth token (`xoxp-...`) and set `SLACK_MCP_XOXP_TOKEN`
instead.

### Google Drive
The local `gdrive` server reuses the existing Opticwise service account
(`opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com`).
**The service account can only see Drive files that have been explicitly
shared with its email.** To make a folder visible to Cursor:

1. Open the folder in Drive
2. Share → add `opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com`
3. Give it Viewer (read-only) access

Alternatively, enable domain-wide delegation on the service account in Google
Workspace and set `GOOGLE_DRIVE_IMPERSONATE_USER=bill@opticwise.com` in the
MCP env block — the server will then act as that user and see everything they
can.

### Fathom
Uses the Bill Demas Fathom API key. The free tier is 60 calls/min/user.

## Local development

Each subfolder is a self-contained Node project. To work on one:

```bash
cd mcp-servers/fathom
npm install
FATHOM_API_KEY=... node index.js   # talks MCP over stdio
```

Restart Cursor (or toggle the MCP off/on in Settings → Tools & Integrations →
MCP) to pick up code changes.

## Adding a new MCP server

1. Create `mcp-servers/<name>/` with `package.json` + `index.js`
2. Use `@modelcontextprotocol/sdk` and `StdioServerTransport`
3. Add an entry to `.cursor/mcp.json` and `.cursor/mcp.example.json`
4. Document it in this README
