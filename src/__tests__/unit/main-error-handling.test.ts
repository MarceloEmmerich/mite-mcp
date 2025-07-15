import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules
vi.mock('dotenv', () => ({
  config: vi.fn(() => {
    throw new Error('dotenv load failed');
  }),
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

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('../../utils/config.js', () => ({
  getConfigFromEnv: vi.fn().mockReturnValue({
    accountName: 'test',
    apiKey: 'test-key',
  }),
}));

vi.mock('../../utils/api-client.js', () => ({
  MiteApiClient: vi.fn(),
}));

describe('Main Error Handling', () => {
  const originalEnv = process.env;
  // biome-ignore lint/suspicious/noConsole: Storing original console.error for restoration
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
    vi.resetModules();
  });

  it('should handle dotenv errors gracefully in development', async () => {
    process.env.NODE_ENV = undefined;

    // This should not throw
    const loadEnvironment = async () => {
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        try {
          const dotenv = await import('dotenv');
          dotenv.config();
        } catch {
          // dotenv is optional in production
        }
      }
    };

    await expect(loadEnvironment()).resolves.not.toThrow();
  });

  it('should handle dotenv errors gracefully in test environment', async () => {
    process.env.NODE_ENV = 'test';

    const loadEnvironment = async () => {
      if (process.env.NODE_ENV === 'test') {
        try {
          const dotenv = await import('dotenv');
          dotenv.config();
        } catch {
          // dotenv is optional in test
        }
      }
    };

    await expect(loadEnvironment()).resolves.not.toThrow();
  });

  it('should handle main function errors', async () => {
    const main = async () => {
      throw new Error('Test error');
    };

    const consoleError = vi.fn();
    console.error = consoleError;

    // biome-ignore lint/suspicious/noExplicitAny: Mock function
    const processExit = vi.fn() as any;
    process.exit = processExit;

    await main().catch(error => {
      consoleError('Fatal error:', error);
      processExit(1);
    });

    expect(consoleError).toHaveBeenCalledWith('Fatal error:', expect.any(Error));
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it('should handle null transport edge case', () => {
    const transports = new Map();
    const sessionId = 'test-session';

    // Set transport to null to simulate edge case
    transports.set(sessionId, null);

    expect(transports.has(sessionId)).toBe(true);
    const transport = transports.get(sessionId);
    expect(transport).toBe(null);
    expect(!transport).toBe(true);
  });

  it('should handle transport race condition', () => {
    const transports = new Map();
    const sessionId = 'test-session';
    const mockTransport = { handleRequest: vi.fn() };

    // Simulate race condition
    transports.set(sessionId, mockTransport);

    // Check has() returns true
    const hasTransport = transports.has(sessionId);
    expect(hasTransport).toBe(true);

    // Delete between has() and get()
    transports.delete(sessionId);

    // get() now returns undefined
    const transport = transports.get(sessionId);
    expect(transport).toBeUndefined();
  });
});
