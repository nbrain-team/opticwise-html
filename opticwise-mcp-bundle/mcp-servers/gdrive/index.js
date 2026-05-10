#!/usr/bin/env node
// Opticwise Google Drive MCP server.
// Uses the Opticwise service account (opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com)
// to access Drive files. Note: the service account can only see files explicitly shared with it,
// or files in Shared Drives where it is a member.
//
// Auth (one of):
//   GOOGLE_SERVICE_ACCOUNT_JSON  -> raw JSON string of the service account key
//   GOOGLE_APPLICATION_CREDENTIALS -> path to a service account JSON file
//
// Optional:
//   GOOGLE_DRIVE_IMPERSONATE_USER -> a workspace user email to impersonate (requires
//     domain-wide delegation enabled on the service account)

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import fs from 'node:fs';

function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  throw new Error('Provide GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
}

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/presentations.readonly',
];

const credentials = loadCredentials();
const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
  subject: process.env.GOOGLE_DRIVE_IMPERSONATE_USER || undefined,
});

const drive = google.drive({ version: 'v3', auth });

// MIME mappings for export of Google Workspace files.
const EXPORT_MIME = {
  'application/vnd.google-apps.document': 'text/markdown',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
  'application/vnd.google-apps.drawing': 'image/png',
};

const TOOLS = [
  {
    name: 'search_files',
    description:
      'Search Google Drive files visible to the Opticwise service account. Supports full-text search and Drive query syntax. Returns id, name, mimeType, size, modifiedTime, and webViewLink for each match.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Free text or Drive query (e.g. `name contains "proposal"`, `mimeType = "application/pdf"`, `modifiedTime > "2026-01-01T00:00:00"`)',
        },
        page_size: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
        order_by: { type: 'string', description: 'e.g. modifiedTime desc' },
        include_shared_drives: { type: 'boolean', default: true },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_folder',
    description: 'List files inside a Drive folder by folder ID.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string' },
        page_size: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      },
      required: ['folder_id'],
    },
  },
  {
    name: 'get_file_metadata',
    description: 'Get full metadata for a Drive file by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: { type: 'string' },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'read_file',
    description:
      'Read the contents of a Drive file. Google Workspace files are exported (Docs->Markdown, Sheets->CSV, Slides->plain text). Other text-like files are returned as UTF-8. Binary files are returned base64-encoded with a `binary: true` flag.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: { type: 'string' },
        max_bytes: {
          type: 'integer',
          description: 'Truncate the response after this many bytes (default 200000)',
          default: 200000,
        },
      },
      required: ['file_id'],
    },
  },
];

function isProbablyText(mimeType) {
  if (!mimeType) return false;
  if (mimeType.startsWith('text/')) return true;
  return [
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-yaml',
    'application/x-sh',
  ].includes(mimeType);
}

async function readFile(fileId, maxBytes) {
  const meta = (await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
    supportsAllDrives: true,
  })).data;

  const mimeType = meta.mimeType || '';
  let content;
  let exported = false;

  if (EXPORT_MIME[mimeType]) {
    const exportMime = EXPORT_MIME[mimeType];
    const res = await drive.files.export(
      { fileId, mimeType: exportMime },
      { responseType: 'arraybuffer' },
    );
    content = Buffer.from(res.data);
    exported = true;
  } else {
    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' },
    );
    content = Buffer.from(res.data);
  }

  const truncated = content.length > maxBytes;
  if (truncated) content = content.subarray(0, maxBytes);

  if (isProbablyText(exported ? EXPORT_MIME[mimeType] : mimeType) || exported) {
    return {
      ...meta,
      exported_as: exported ? EXPORT_MIME[mimeType] : undefined,
      bytes: content.length,
      truncated,
      content: content.toString('utf8'),
    };
  }

  return {
    ...meta,
    bytes: content.length,
    truncated,
    binary: true,
    content_base64: content.toString('base64'),
  };
}

const server = new Server(
  { name: 'opticwise-gdrive', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;
    switch (name) {
      case 'search_files': {
        const { query, page_size = 25, order_by, include_shared_drives = true } = args;
        const looksLikeDriveQuery = /(=|contains|>|<|in parents|trashed)/.test(query);
        const q = looksLikeDriveQuery ? query : `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`;
        const res = await drive.files.list({
          q,
          pageSize: page_size,
          orderBy: order_by,
          fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, parents, owners)',
          includeItemsFromAllDrives: include_shared_drives,
          supportsAllDrives: include_shared_drives,
          corpora: include_shared_drives ? 'allDrives' : 'user',
        });
        result = res.data;
        break;
      }
      case 'list_folder': {
        const { folder_id, page_size = 50 } = args;
        const res = await drive.files.list({
          q: `'${folder_id}' in parents and trashed = false`,
          pageSize: page_size,
          fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink)',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          corpora: 'allDrives',
        });
        result = res.data;
        break;
      }
      case 'get_file_metadata': {
        const { file_id } = args;
        const res = await drive.files.get({
          fileId: file_id,
          fields: '*',
          supportsAllDrives: true,
        });
        result = res.data;
        break;
      }
      case 'read_file': {
        const { file_id, max_bytes = 200000 } = args;
        result = await readFile(file_id, max_bytes);
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Opticwise Google Drive MCP server running on stdio');
