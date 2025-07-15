#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createCustomersTools } from './tools/customers.js';
import { createProjectsTools } from './tools/projects.js';
import { createServicesTools } from './tools/services.js';
import { createStopwatchTools } from './tools/stopwatch.js';
import { createTimeEntriesTools } from './tools/time-entries.js';
import { MiteApiClient } from './utils/api-client.js';
import { getConfigFromEnv } from './utils/config.js';

async function main() {
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

  const server = new Server(
    {
      name: 'mite-mcp',
      version: '0.1.1',
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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // biome-ignore lint/suspicious/noConsole: CLI output
  console.error('mite MCP server running on stdio');
}

main().catch(error => {
  // biome-ignore lint/suspicious/noConsole: CLI output
  console.error('Fatal error:', error);
  process.exit(1);
});
