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

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn(),
}));

vi.mock('commander', () => ({
  Command: vi.fn().mockImplementation(() => ({
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    parse: vi.fn(),
    opts: vi.fn().mockReturnValue({
      http: false,
      port: '3000',
      host: 'localhost',
    }),
  })),
}));

vi.mock('node:http', () => ({
  createServer: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('test-uuid-123'),
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
    process.env.NODE_ENV = 'test';
    console.error = vi.fn();
    // biome-ignore lint/suspicious/noExplicitAny: Mock function
    process.exit = vi.fn() as any;
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  it('should exit with error when configuration is invalid', async () => {
    vi.doMock('../../utils/config.js', () => ({
      getConfigFromEnv: vi.fn().mockImplementation(() => {
        throw new Error('Invalid configuration');
      }),
    }));

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
    vi.doMock('../../utils/config.js', () => ({
      getConfigFromEnv: vi.fn().mockReturnValue({
        accountName: 'test',
        apiKey: 'test-key',
      }),
    }));

    vi.doMock('../../utils/api-client.js', () => ({
      // biome-ignore lint/suspicious/noExplicitAny: Mock implementation
      MiteApiClient: vi.fn().mockImplementation(() => ({}) as any),
    }));

    await import('../../index.js');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(Server).toHaveBeenCalledWith(
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

    // biome-ignore lint/suspicious/noConsole: Testing console output
    expect(console.error).toHaveBeenCalledWith('mite MCP server running on stdio');
  });
});
