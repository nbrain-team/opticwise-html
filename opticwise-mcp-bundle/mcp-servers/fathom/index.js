#!/usr/bin/env node
// Opticwise Fathom MCP server.
// Wraps the public Fathom REST API (https://api.fathom.ai/external/v1) so Cursor
// can query meetings, transcripts, summaries, and action items.
//
// Auth: requires FATHOM_API_KEY in env. The server passes it as `X-Api-Key`.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE = process.env.FATHOM_API_BASE || 'https://api.fathom.ai/external/v1';
const API_KEY = process.env.FATHOM_API_KEY;

if (!API_KEY) {
  console.error('FATHOM_API_KEY env var is required');
  process.exit(1);
}

async function fathom(path, { method = 'GET', query, body } = {}) {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      'X-Api-Key': API_KEY,
      'Accept': 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Fathom API ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

const TOOLS = [
  {
    name: 'list_meetings',
    description:
      'List recent Fathom meetings. Supports filtering by date, recorder, and invitee domain. Use include_* flags to embed transcripts, summaries, or action items in the response (heavier payloads). Returns a paginated list with a `next_cursor` for follow-up calls.',
    inputSchema: {
      type: 'object',
      properties: {
        include_transcript: { type: 'boolean', default: false },
        include_summary: { type: 'boolean', default: true },
        include_action_items: { type: 'boolean', default: true },
        include_crm_matches: { type: 'boolean', default: false },
        created_after: {
          type: 'string',
          description: 'ISO 8601 timestamp, e.g. 2026-01-01T00:00:00Z',
        },
        created_before: { type: 'string', description: 'ISO 8601 timestamp' },
        recorded_by: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by recorder email addresses',
        },
        calendar_invitees_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter to meetings that include attendees from these domains',
        },
        cursor: { type: 'string', description: 'Pagination cursor from a prior response' },
        limit: { type: 'integer', description: 'Page size (1-100)', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'get_meeting',
    description: 'Fetch a single meeting/recording by its Fathom recording ID.',
    inputSchema: {
      type: 'object',
      properties: {
        recording_id: { type: 'string' },
        include_transcript: { type: 'boolean', default: true },
        include_summary: { type: 'boolean', default: true },
        include_action_items: { type: 'boolean', default: true },
      },
      required: ['recording_id'],
    },
  },
  {
    name: 'get_transcript',
    description:
      'Get the full transcript for a Fathom recording. Returns an array of speaker-attributed segments with timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        recording_id: { type: 'string' },
      },
      required: ['recording_id'],
    },
  },
  {
    name: 'list_team_members',
    description: 'List Fathom team members visible to this API key.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const server = new Server(
  { name: 'opticwise-fathom', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;
    switch (name) {
      case 'list_meetings': {
        const {
          include_transcript = false,
          include_summary = true,
          include_action_items = true,
          include_crm_matches = false,
          created_after,
          created_before,
          recorded_by,
          calendar_invitees_domains,
          cursor,
          limit,
        } = args;
        result = await fathom('/meetings', {
          query: {
            include_transcript,
            include_summary,
            include_action_items,
            include_crm_matches,
            created_after,
            created_before,
            'recorded_by[]': recorded_by,
            'calendar_invitees_domains[]': calendar_invitees_domains,
            cursor,
            limit,
          },
        });
        break;
      }
      case 'get_meeting': {
        const { recording_id, include_transcript = true, include_summary = true, include_action_items = true } = args;
        result = await fathom(`/recordings/${encodeURIComponent(recording_id)}`, {
          query: { include_transcript, include_summary, include_action_items },
        });
        break;
      }
      case 'get_transcript': {
        const { recording_id } = args;
        result = await fathom(`/recordings/${encodeURIComponent(recording_id)}/transcript`);
        break;
      }
      case 'list_team_members':
        result = await fathom('/team_members');
        break;
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
console.error('Opticwise Fathom MCP server running on stdio');
