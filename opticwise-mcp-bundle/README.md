# Opticwise MCP Bundle

This is a one-step installer that connects your **Cursor** to the live Opticwise
data sources — production Postgres CRM (read-only), Pinecone vectors, Fathom
meetings, and Google Drive.

After install, you can ask Cursor things like:

- "Show me deals stuck in the proposal stage for >30 days"
- "What action items came out of last week's Fathom calls?"
- "Search the support knowledge base for `guest network` issues"
- "List files in the `Catalyst Denver` Drive folder"

…and it answers using the real data, no copy-paste required.

---

## Install (3 steps)

### 1. Requirements

- **Cursor** installed
- **Node.js 18 or newer** — check with `node -v`. If missing: <https://nodejs.org/>
- macOS or Linux (Windows: use WSL)

### 2. Run the installer

Unzip this bundle anywhere, open a terminal in the unzipped folder, then:

```bash
./install.sh
```

That's it. The script will:

1. Copy the custom MCP servers to `~/.opticwise-mcp/`
2. Install their Node dependencies
3. Add four entries to `~/.cursor/mcp.json` (backing up the existing one)

### 3. Restart Cursor

Open Cursor → **Settings → Tools & Integrations → MCP**. You should see four
servers with green dots:

| Server | What it does |
|---|---|
| `opticwise-postgres` | Read-only access to the production Render Postgres (Opticwise CRM) |
| `opticwise-pinecone` | Search/manage the Pinecone vector indexes (transcripts + support KB) |
| `opticwise-fathom` | List Fathom meetings, fetch transcripts, summaries, action items |
| `opticwise-gdrive` | Search and read Google Drive files (any folder shared with the Opticwise service account) |

---

## What's included

```
opticwise-mcp-bundle/
├── install.sh                       ← run this
├── README.md                        ← you're reading it
└── mcp-servers/
    ├── fathom/                      ← custom Node MCP for Fathom API
    │   ├── index.js
    │   └── package.json
    └── gdrive/                      ← custom Node MCP for Google Drive (service account)
        ├── index.js
        ├── package.json
        └── credentials.json         ← Opticwise service account key (SECRET)
```

---

## Security notes

- **This bundle contains live production credentials.** Keep the zip out of
  shared chats, public folders, or any version control.
- The Postgres connection uses the `mcp_readonly` role — it can `SELECT` from
  the live database but cannot write, modify, or drop anything. Verified.
- The Google Drive integration uses a service account that can only see files
  explicitly shared with `opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com`.
- The Slack integration is not included — the Opticwise Slack bot is missing
  the read scopes needed by the MCP server. Contact the Opticwise team if you
  need Slack access.

---

## Troubleshooting

**"Node.js is not installed"** — install from <https://nodejs.org/> (LTS is fine), restart your terminal, run `./install.sh` again.

**MCP shows red in Cursor** — open the MCP entry in Cursor settings, click the
output/log to see the error. Most common: stale `npx` cache. Fix with
`rm -rf ~/.npm/_npx && open -a Cursor`.

**`opticwise-gdrive` returns 0 files** — that's expected. The service account
only sees Drive files that have been explicitly shared with its email. Ask the
Opticwise team to share specific folders, or use full-text search on a known
file ID.

**To uninstall** — delete the four `opticwise-*` entries from
`~/.cursor/mcp.json`, then `rm -rf ~/.opticwise-mcp/`.

---

## Prompt to give Cursor (optional)

Once installed, paste this into a new Cursor chat to verify everything works:

> Hi! I just installed the Opticwise MCP bundle. Please run a quick sanity
> check by calling each of these tools and reporting what you see:
> 1. `opticwise-postgres` — list the public-schema tables
> 2. `opticwise-pinecone` — list available indexes
> 3. `opticwise-fathom` — fetch the 3 most recent meetings (titles + dates)
> 4. `opticwise-gdrive` — search for any file containing "opticwise"
>
> If any of them fail, show me the exact error so I can debug.
