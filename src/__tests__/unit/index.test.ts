import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

// Mock our modules
vi.mock('../../utils/config.js', () => ({
  getConfigFromEnv: vi.fn(),
}));

vi.mock('../../utils/api-client.js', () => ({
  MiteApiClient: vi.fn(),
}));

vi.mock('../../tools/time-entries.js', () => ({
  createTimeEntriesTools: vi.fn().mockReturnValue({
    listTimeEntries: {
      name: 'list_time_entries',
      description: 'List time entries',
      inputSchema: {},
      execute: vi.fn(),
    },
  }),
}));

vi.mock('../../tools/customers.js', () => ({
  createCustomersTools: vi.fn().mockReturnValue({
    listCustomers: {
      name: 'list_customers',
      description: 'List customers',
      inputSchema: {},
      execute: vi.fn(),
    },
  }),
}));

vi.mock('../../tools/projects.js', () => ({
  createProjectsTools: vi.fn().mockReturnValue({
    listProjects: {
      name: 'list_projects',
      description: 'List projects',
      inputSchema: {},
      execute: vi.fn(),
    },
  }),
}));

vi.mock('../../tools/services.js', () => ({
  createServicesTools: vi.fn().mockReturnValue({
    listServices: {
      name: 'list_services',
      description: 'List services',
      inputSchema: {},
      execute: vi.fn(),
    },
  }),
}));

vi.mock('../../tools/stopwatch.js', () => ({
  createStopwatchTools: vi.fn().mockReturnValue({
    getStopwatchStatus: {
      name: 'get_stopwatch_status',
      description: 'Get stopwatch status',
      inputSchema: {},
      execute: vi.fn(),
    },
  }),
}));

describe('MCP Server', () => {
  const originalEnv = process.env;
  // biome-ignore lint/suspicious/noConsole: Testing console output
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeEach(() => {
    process.env = { ...originalEnv };
    console.error = vi.fn();
    // biome-ignore lint/suspicious/noExplicitAny: Mock function
    process.exit = vi.fn() as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  it('should exit with error when configuration is invalid', async () => {
    const { getConfigFromEnv } = await import('../../utils/config.js');
    vi.mocked(getConfigFromEnv).mockImplementation(() => {
      throw new Error('Invalid configuration');
    });

    await import('../../index.js');

    await new Promise(resolve => setTimeout(resolve, 10));

    // biome-ignore lint/suspicious/noConsole: Testing console output
    expect(console.error).toHaveBeenCalledWith('Configuration error:', 'Invalid configuration');
    // biome-ignore lint/suspicious/noConsole: Testing console output
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Please set the following environment variables:')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should setup server with valid configuration', async () => {
    const { getConfigFromEnv } = await import('../../utils/config.js');
    const { MiteApiClient } = await import('../../utils/api-client.js');

    vi.mocked(getConfigFromEnv).mockReturnValue({
      accountName: 'test',
      apiKey: 'test-key',
    });

    // biome-ignore lint/suspicious/noExplicitAny: Mock implementation
    vi.mocked(MiteApiClient).mockImplementation(() => ({}) as any);

    // Re-import to trigger the module execution
    vi.resetModules();
    vi.mock('../../utils/config.js', () => ({
      getConfigFromEnv: vi.fn().mockReturnValue({
        accountName: 'test',
        apiKey: 'test-key',
      }),
    }));

    await import('../../index.js');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(Server).toHaveBeenCalledWith(
      {
        name: 'mite-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // biome-ignore lint/suspicious/noConsole: Testing console output
    expect(console.error).toHaveBeenCalledWith('mite MCP server running on stdio');
  });
});
