#!/usr/bin/env bash
# Opticwise MCP bundle installer.
#
# What this does:
#   1. Copies the custom MCP servers (Fathom, Google Drive) to ~/.opticwise-mcp/
#   2. Runs `npm install` in each
#   3. Merges 4 entries into ~/.cursor/mcp.json (or creates it):
#        - opticwise-postgres (Render Postgres, read-only)
#        - opticwise-pinecone (Pinecone vectors)
#        - opticwise-fathom   (Fathom meetings/transcripts)
#        - opticwise-gdrive   (Google Drive via service account)
#   4. Backs up any existing ~/.cursor/mcp.json
#
# Usage:
#   ./install.sh
#
# Requirements:
#   - Node.js 18+   (https://nodejs.org/)
#   - macOS or Linux
#
# Override install location:
#   OPTICWISE_MCP_DIR=/some/path ./install.sh

set -euo pipefail

INSTALL_DIR="${OPTICWISE_MCP_DIR:-$HOME/.opticwise-mcp}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Opticwise MCP Bundle — Installer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Source:  $SCRIPT_DIR
 Install: $INSTALL_DIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

# 1. Node.js check
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Install it first: https://nodejs.org/  (any version 18 or newer)"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required. Found: $(node -v)"
  exit 1
fi
echo "✓ Node $(node -v) detected"

# 2. Copy mcp-servers/ to install dir (preserving credentials.json mode 600)
mkdir -p "$INSTALL_DIR"
cp -R "$SCRIPT_DIR/mcp-servers" "$INSTALL_DIR/"
chmod 600 "$INSTALL_DIR/mcp-servers/gdrive/credentials.json"
echo "✓ Copied custom MCP servers to $INSTALL_DIR/mcp-servers/"

# 3. Install Node deps for each custom server
for dir in "$INSTALL_DIR/mcp-servers"/*/; do
  if [ -f "$dir/package.json" ]; then
    name=$(basename "$dir")
    echo "  Installing deps for $name..."
    (cd "$dir" && npm install --silent --no-audit --no-fund 2>&1 | tail -3)
  fi
done
echo "✓ Custom server dependencies installed"

# 4. Merge entries into ~/.cursor/mcp.json
NODE_BIN="$(command -v node)"

node - "$INSTALL_DIR" "$NODE_BIN" <<'NODE_SCRIPT'
const fs = require('fs');
const path = require('path');
const os = require('os');

const installDir = process.argv[2];
const nodeBin = process.argv[3];
const cursorDir = path.join(os.homedir(), '.cursor');
const mcpPath = path.join(cursorDir, 'mcp.json');

fs.mkdirSync(cursorDir, { recursive: true });

let config = { mcpServers: {} };
if (fs.existsSync(mcpPath)) {
  try {
    config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    if (!config.mcpServers) config.mcpServers = {};
    const backup = mcpPath + '.bak.' + Date.now();
    fs.copyFileSync(mcpPath, backup);
    console.log('  Backed up existing config to:', backup);
  } catch (e) {
    console.error('ERROR: existing ~/.cursor/mcp.json is invalid JSON. Aborting.');
    console.error(e.message);
    process.exit(1);
  }
}

const newServers = {
  'opticwise-postgres': {
    command: 'npx',
    args: [
      '-y',
      '@henkey/postgres-mcp-server',
      '--connection-string',
      'postgresql://mcp_readonly:iI6ZjyoP8yYAqwjVWSWB2Y_OcSi6P0zB@dpg-d4eboeh5pdvs73fpagfg-a.oregon-postgres.render.com/opticwise_db?sslmode=require',
    ],
  },
  'opticwise-pinecone': {
    command: 'npx',
    args: ['-y', '@pinecone-database/mcp'],
    env: {
      PINECONE_API_KEY:
        'pcsk_2p5juy_EUCL2h58aqPtxnp9dBqiaqseUWbi5xHm18vf8FkmzJDzqU53ptK6Hd5uoS3BGTw',
    },
  },
  'opticwise-fathom': {
    command: nodeBin,
    args: [path.join(installDir, 'mcp-servers/fathom/index.js')],
    env: {
      FATHOM_API_KEY:
        '8fuLKlIsTp5Jbi0bb_ETXw.dnF6flqP82lAvS4-0o25q3-KYQ6IYrenl7VXhLgcCa4',
    },
  },
  'opticwise-gdrive': {
    command: nodeBin,
    args: [path.join(installDir, 'mcp-servers/gdrive/index.js')],
    env: {
      GOOGLE_APPLICATION_CREDENTIALS: path.join(
        installDir,
        'mcp-servers/gdrive/credentials.json',
      ),
    },
  },
};

const overwritten = [];
for (const [name, spec] of Object.entries(newServers)) {
  if (config.mcpServers[name]) overwritten.push(name);
  config.mcpServers[name] = spec;
}

fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2));
console.log('✓ Wrote', mcpPath);
if (overwritten.length) {
  console.log('  (Replaced existing entries: ' + overwritten.join(', ') + ')');
}
NODE_SCRIPT

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Done. Next step: restart Cursor.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After restart, open Cursor → Settings → Tools & Integrations
→ MCP. You should see four green dots:
  • opticwise-postgres   (Render Postgres, read-only — 19 tools)
  • opticwise-pinecone   (Pinecone vectors — 9 tools)
  • opticwise-fathom     (Fathom meetings — 4 tools)
  • opticwise-gdrive     (Google Drive — 4 tools)

Try it: ask Cursor "list the 5 most recent Fathom meetings"
or "show me the Opticwise CRM tables" — it should answer
using the live data.

To uninstall: delete the four "opticwise-*" entries from
~/.cursor/mcp.json and remove $INSTALL_DIR.
EOF
