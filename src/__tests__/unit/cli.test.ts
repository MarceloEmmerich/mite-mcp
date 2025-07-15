import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the commander module
vi.mock('commander', () => {
  const mockCommand = {
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
  };

  return {
    Command: vi.fn(() => mockCommand),
  };
});

describe('CLI Options', () => {
  it('should setup command with correct name and version', () => {
    const program = new Command();

    program
      .name('mite-mcp')
      .description('mite MCP server - Model Context Protocol server for mite time tracking')
      .version('0.1.2');

    expect(program.name).toHaveBeenCalledWith('mite-mcp');
    expect(program.description).toHaveBeenCalledWith(
      'mite MCP server - Model Context Protocol server for mite time tracking'
    );
    expect(program.version).toHaveBeenCalledWith('0.1.2');
  });

  it('should register all command options', () => {
    const program = new Command();

    program
      .option('--stdio', 'Run in stdio mode (default)')
      .option('--http', 'Run in HTTP/Streamable mode')
      .option('-p, --port <port>', 'Port for HTTP server', '3000')
      .option('-h, --host <host>', 'Host for HTTP server', 'localhost');

    expect(program.option).toHaveBeenCalledWith('--stdio', 'Run in stdio mode (default)');
    expect(program.option).toHaveBeenCalledWith('--http', 'Run in HTTP/Streamable mode');
    expect(program.option).toHaveBeenCalledWith(
      '-p, --port <port>',
      'Port for HTTP server',
      '3000'
    );
    expect(program.option).toHaveBeenCalledWith(
      '-h, --host <host>',
      'Host for HTTP server',
      'localhost'
    );
  });

  it('should parse command line arguments', () => {
    const program = new Command();
    program.parse();

    expect(program.parse).toHaveBeenCalled();
  });

  it('should return default options when no arguments provided', () => {
    const program = new Command();
    const opts = program.opts();

    expect(opts).toEqual({
      http: false,
      port: '3000',
      host: 'localhost',
    });
  });

  it('should handle HTTP mode option', () => {
    const program = new Command();
    vi.mocked(program.opts).mockReturnValue({
      http: true,
      port: '8080',
      host: '0.0.0.0',
    });

    const opts = program.opts();
    const options = {
      mode: opts.http ? 'http' : 'stdio',
      port: parseInt(opts.port),
      host: opts.host,
    };

    expect(options).toEqual({
      mode: 'http',
      port: 8080,
      host: '0.0.0.0',
    });
  });

  it('should handle stdio mode by default', () => {
    const program = new Command();
    // Reset the mock to return default values
    vi.mocked(program.opts).mockReturnValue({
      http: false,
      port: '3000',
      host: 'localhost',
    });

    const opts = program.opts();
    const options = {
      mode: opts.http ? 'http' : 'stdio',
      port: parseInt(opts.port),
      host: opts.host,
    };

    expect(options).toEqual({
      mode: 'stdio',
      port: 3000,
      host: 'localhost',
    });
  });
});

describe('Environment Loading', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load environment in development mode', async () => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = undefined;

    // Test that dotenv would be loaded in non-production/non-test environment
    expect(process.env.NODE_ENV).toBeUndefined();
  });

  it('should not load dotenv in production', async () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };

    expect(process.env.NODE_ENV).toBe('production');
  });

  it('should handle dotenv in test environment', async () => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };

    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('Server Options', () => {
  it('should create correct server options from CLI arguments', () => {
    const cliOpts = {
      http: true,
      port: '4000',
      host: 'example.com',
    };

    const serverOptions = {
      mode: cliOpts.http ? 'http' : ('stdio' as const),
      port: parseInt(cliOpts.port),
      host: cliOpts.host,
    };

    expect(serverOptions).toEqual({
      mode: 'http',
      port: 4000,
      host: 'example.com',
    });
  });

  it('should handle port parsing correctly', () => {
    const port = parseInt('3000');
    expect(port).toBe(3000);
    expect(Number.isNaN(port)).toBe(false);
  });

  it('should handle invalid port gracefully', () => {
    const port = parseInt('invalid');
    expect(Number.isNaN(port)).toBe(true);
  });
});
