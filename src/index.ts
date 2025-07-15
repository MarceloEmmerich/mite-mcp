#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Command } from 'commander';
import { z } from 'zod';
import { createCustomersTools } from './tools/customers.js';
import { createProjectsTools } from './tools/projects.js';
import { createServicesTools } from './tools/services.js';
import { createStopwatchTools } from './tools/stopwatch.js';
import { createTimeEntriesTools } from './tools/time-entries.js';
import { MiteApiClient } from './utils/api-client.js';
import { getConfigFromEnv } from './utils/config.js';

interface ServerOptions {
  mode: 'stdio' | 'http';
  port: number;
  host: string;
}

async function setupServer(apiClient: MiteApiClient): Promise<Server> {
  const server = new Server(
    {
      name: 'mite-mcp',
      version: '0.1.2',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const timeEntriesTools = createTimeEntriesTools(apiClient);
  const customersTools = createCustomersTools(apiClient);
  const projectsTools = createProjectsTools(apiClient);
  const servicesTools = createServicesTools(apiClient);
  const stopwatchTools = createStopwatchTools(apiClient);

  const allTools = {
    ...timeEntriesTools,
    ...customersTools,
    ...projectsTools,
    ...servicesTools,
    ...stopwatchTools,
  };

  // Create a mapping from tool names to tool objects
  const toolsByName = new Map<string, (typeof allTools)[keyof typeof allTools]>();
  Object.values(allTools).forEach(tool => {
    toolsByName.set(tool.name, tool);
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(allTools).map(([_, tool]) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: true,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params as { name: string; arguments?: unknown };

    const tool = toolsByName.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      const validatedInput = tool.inputSchema.parse(args || {});
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool execution
      const result = await (tool as any).execute(validatedInput);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  });

  return server;
}

async function runStdioServer(server: Server): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // biome-ignore lint/suspicious/noConsole: CLI output
  console.error('mite MCP server running on stdio');
}

async function runHttpServer(server: Server, options: ServerOptions): Promise<void> {
  const httpServer = createServer();
  const transports = new Map<string, StreamableHTTPServerTransport>();

  httpServer.on('request', async (req, res) => {
    if (!req.url) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (url.pathname === '/' || url.pathname === '/mcp') {
      if (req.method === 'POST') {
        // Handle POST requests
        const sessionId = req.headers['mcp-session-id'] as string;

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = JSON.parse(body);

            let transport: StreamableHTTPServerTransport;

            if (sessionId && transports.has(sessionId)) {
              // Reuse existing transport
              const existingTransport = transports.get(sessionId);
              if (!existingTransport) {
                throw new Error('Transport not found');
              }
              transport = existingTransport;
            } else if (!sessionId && parsedBody.method === 'initialize') {
              // New initialization request
              transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId: string) => {
                  transports.set(sessionId, transport);
                  // biome-ignore lint/suspicious/noConsole: CLI output
                  console.error(`Session initialized with ID: ${sessionId}`);
                },
                enableDnsRebindingProtection: true,
                allowedHosts: [
                  options.host,
                  'localhost',
                  '127.0.0.1',
                  `${options.host}:${options.port}`,
                  `localhost:${options.port}`,
                  `127.0.0.1:${options.port}`,
                ],
              });

              // Handle transport close
              transport.onclose = () => {
                if (transport.sessionId) {
                  transports.delete(transport.sessionId);
                  // biome-ignore lint/suspicious/noConsole: CLI output
                  console.error(`Session closed: ${transport.sessionId}`);
                }
              };

              await server.connect(transport);
            } else {
              // Invalid request
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  jsonrpc: '2.0',
                  error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                  },
                  id: null,
                })
              );
              return;
            }

            await transport.handleRequest(req, res, parsedBody);
          } catch (error) {
            // biome-ignore lint/suspicious/noConsole: CLI output
            console.error('Error handling MCP request:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  jsonrpc: '2.0',
                  error: {
                    code: -32603,
                    message: 'Internal server error',
                  },
                  id: null,
                })
              );
            }
          }
        });
      } else if (req.method === 'GET') {
        // Handle GET requests for SSE streams
        const sessionId = req.headers['mcp-session-id'] as string;

        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid or missing session ID');
          return;
        }

        const transport = transports.get(sessionId);
        if (!transport) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Transport not found');
          return;
        }
        await transport.handleRequest(req, res);
      } else if (req.method === 'DELETE') {
        // Handle DELETE requests for session termination
        const sessionId = req.headers['mcp-session-id'] as string;

        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid or missing session ID');
          return;
        }

        const transport = transports.get(sessionId);
        if (!transport) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Transport not found');
          return;
        }
        await transport.handleRequest(req, res);
      } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  httpServer.listen(options.port, options.host, () => {
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error(`mite MCP server running on HTTP at http://${options.host}:${options.port}`);
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error(`Connect via Streamable HTTP at: http://${options.host}:${options.port}/`);
  });
}

async function loadEnvironment(): Promise<void> {
  // Load .env file in development
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    try {
      // Temporarily capture stdout to suppress dotenv output
      const originalWrite = process.stdout.write;
      process.stdout.write = () => true;

      const dotenv = await import('dotenv');
      dotenv.config();

      // Restore stdout
      process.stdout.write = originalWrite;
    } catch {
      // dotenv is optional in production
    }
  } else if (process.env.NODE_ENV === 'test') {
    // In test environment, load dotenv without capturing output
    try {
      const dotenv = await import('dotenv');
      dotenv.config();
    } catch {
      // dotenv is optional in test
    }
  }
}

async function main() {
  const program = new Command();

  program
    .name('mite-mcp')
    .description('mite MCP server - Model Context Protocol server for mite time tracking')
    .version('0.1.2');

  program
    .option('--stdio', 'Run in stdio mode (default)')
    .option('--http', 'Run in HTTP/Streamable mode')
    .option('-p, --port <port>', 'Port for HTTP server', '3000')
    .option('-h, --host <host>', 'Host for HTTP server', 'localhost')
    .parse();

  const opts = program.opts();

  const options: ServerOptions = {
    mode: opts.http ? 'http' : 'stdio',
    port: parseInt(opts.port),
    host: opts.host,
  };

  await loadEnvironment();

  let config: ReturnType<typeof getConfigFromEnv>;
  let apiClient: MiteApiClient;

  try {
    config = getConfigFromEnv();
    apiClient = new MiteApiClient(config);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('Configuration error:', error instanceof Error ? error.message : String(error));
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('\nPlease set the following environment variables:');
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('  MITE_ACCOUNT_NAME: Your mite account name (required)');
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('  MITE_API_KEY: Your mite API key (recommended)');
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('  OR');
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('  MITE_EMAIL: Your mite email');
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error('  MITE_PASSWORD: Your mite password');
    process.exit(1);
  }

  const server = await setupServer(apiClient);

  if (options.mode === 'http') {
    await runHttpServer(server, options);
  } else {
    await runStdioServer(server);
  }
}

main().catch(error => {
  // biome-ignore lint/suspicious/noConsole: CLI output
  console.error('Fatal error:', error);
  process.exit(1);
});
