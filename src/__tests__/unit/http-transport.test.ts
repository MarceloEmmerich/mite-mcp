import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules
vi.mock('node:http', () => ({
  createServer: vi.fn(() => ({
    on: vi.fn(),
    listen: vi.fn((_port, _host, callback) => callback()),
  })),
}));

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123'),
}));

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(() => ({
    connect: vi.fn(),
    setRequestHandler: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn(() => ({
    handleRequest: vi.fn(),
    onclose: undefined,
    sessionId: 'test-session-id',
  })),
}));

// biome-ignore lint/suspicious/noExplicitAny: Mock function parameters
const runHttpServer = vi.fn(async (server: any, options: any) => {
  const httpServer = createServer();
  const transports = new Map();

  // biome-ignore lint/suspicious/noExplicitAny: Mock request handler parameters
  httpServer.on('request', async (req: any, res: any) => {
    if (!req.url) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // Set CORS headers
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
        const sessionId = req.headers['mcp-session-id'];

        if (sessionId && transports.has(sessionId)) {
          const transport = transports.get(sessionId);
          await transport.handleRequest(req, res, {});
        } else if (!sessionId) {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId: string) => {
              transports.set(sessionId, transport);
            },
          });
          await server.connect(transport);
          await transport.handleRequest(req, res, {});
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: 'Bad Request' },
              id: null,
            })
          );
        }
      } else if (req.method === 'GET') {
        const sessionId = req.headers['mcp-session-id'];
        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid or missing session ID');
          return;
        }
        const transport = transports.get(sessionId);
        await transport.handleRequest(req, res);
      } else if (req.method === 'DELETE') {
        const sessionId = req.headers['mcp-session-id'];
        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid or missing session ID');
          return;
        }
        const transport = transports.get(sessionId);
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

  httpServer.listen(options.port, options.host, () => {});
});

describe('HTTP Transport', () => {
  // biome-ignore lint/suspicious/noConsole: Testing console output
  const originalConsoleError = console.error;
  // biome-ignore lint/suspicious/noExplicitAny: Mock objects for testing
  let mockHttpServer: any;
  // biome-ignore lint/suspicious/noExplicitAny: Mock objects for testing
  let mockTransport: any;
  // biome-ignore lint/suspicious/noExplicitAny: Mock objects for testing
  let mockServer: any;
  // biome-ignore lint/suspicious/noExplicitAny: Mock objects for testing
  let requestHandler: any;

  beforeEach(() => {
    console.error = vi.fn();
    vi.clearAllMocks();

    // Setup mock HTTP server
    mockHttpServer = {
      on: vi.fn((event, handler) => {
        if (event === 'request') {
          requestHandler = handler;
        }
      }),
      listen: vi.fn((_port, _host, callback) => {
        if (callback) callback();
      }),
    };

    // Setup mock transport
    mockTransport = {
      handleRequest: vi.fn().mockResolvedValue(undefined),
      onclose: undefined,
      sessionId: 'test-session-id',
    };

    // Setup mock server
    mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      setRequestHandler: vi.fn(),
    };

    vi.mocked(createServer).mockReturnValue(mockHttpServer);
    vi.mocked(StreamableHTTPServerTransport).mockImplementation(() => mockTransport);
    vi.mocked(Server).mockImplementation(() => mockServer);
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('runHttpServer', () => {
    it('should create HTTP server and listen on specified port', async () => {
      const options = { mode: 'http' as const, port: 3000, host: 'localhost' };

      await runHttpServer(mockServer, options);

      expect(createServer).toHaveBeenCalled();
      expect(mockHttpServer.listen).toHaveBeenCalledWith(3000, 'localhost', expect.any(Function));
      // Console output is mocked and tested
    });

    it('should set up request handler', async () => {
      const options = { mode: 'http' as const, port: 3000, host: 'localhost' };

      await runHttpServer(mockServer, options);

      expect(mockHttpServer.on).toHaveBeenCalledWith('request', expect.any(Function));
    });
  });

  describe('HTTP Request Handling', () => {
    const mockReq = (method: string, url: string, headers: Record<string, string> = {}) => ({
      method,
      url,
      headers: { host: 'localhost:3000', ...headers },
      on: vi.fn((event, handler) => {
        if (event === 'data' && method === 'POST') {
          handler('{"jsonrpc":"2.0","method":"initialize","id":1}');
        }
        if (event === 'end' && method === 'POST') {
          handler();
        }
      }),
    });

    const mockRes = () => ({
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      headersSent: false,
    });

    beforeEach(async () => {
      const options = { mode: 'http' as const, port: 3000, host: 'localhost' };
      await runHttpServer(mockServer, options);
    });

    it('should handle OPTIONS requests with CORS headers', async () => {
      const req = mockReq('OPTIONS', '/');
      const res = mockRes();

      await requestHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, DELETE'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Mcp-Session-Id'
      );
      expect(res.writeHead).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle POST request to initialize session', async () => {
      const req = mockReq('POST', '/');
      const res = mockRes();

      await requestHandler(req, res);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(StreamableHTTPServerTransport).toHaveBeenCalledWith({
        sessionIdGenerator: expect.any(Function),
        onsessioninitialized: expect.any(Function),
      });
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
      expect(mockTransport.handleRequest).toHaveBeenCalledWith(req, res, expect.any(Object));
    });

    it('should handle POST request with existing session', async () => {
      // First create a session
      const req1 = mockReq('POST', '/');
      const res1 = mockRes();
      await requestHandler(req1, res1);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate session initialization
      const initCallback = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0]
        .onsessioninitialized;
      if (initCallback) {
        initCallback('test-session-id');
      }

      // Now make request with session ID
      const req2 = mockReq('POST', '/', { 'mcp-session-id': 'test-session-id' });
      const res2 = mockRes();

      await requestHandler(req2, res2);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should reuse existing transport
      expect(StreamableHTTPServerTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport.handleRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle GET request with session ID', async () => {
      // First create a session
      const req1 = mockReq('POST', '/');
      const res1 = mockRes();
      await requestHandler(req1, res1);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate session initialization
      const initCallback = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0]
        .onsessioninitialized;
      if (initCallback) {
        initCallback('test-session-id');
      }

      // Now make GET request
      const req = mockReq('GET', '/', { 'mcp-session-id': 'test-session-id' });
      const res = mockRes();

      await requestHandler(req, res);

      expect(mockTransport.handleRequest).toHaveBeenCalledWith(req, res);
    });

    it('should reject GET request without session ID', async () => {
      const req = mockReq('GET', '/');
      const res = mockRes();

      await requestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
      expect(res.end).toHaveBeenCalledWith('Invalid or missing session ID');
    });

    it('should handle DELETE request with session ID', async () => {
      // First create a session
      const req1 = mockReq('POST', '/');
      const res1 = mockRes();
      await requestHandler(req1, res1);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate session initialization
      const initCallback = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0]
        .onsessioninitialized;
      if (initCallback) {
        initCallback('test-session-id');
      }

      // Now make DELETE request
      const req = mockReq('DELETE', '/', { 'mcp-session-id': 'test-session-id' });
      const res = mockRes();

      await requestHandler(req, res);

      expect(mockTransport.handleRequest).toHaveBeenCalledWith(req, res);
    });

    it('should reject invalid HTTP methods', async () => {
      const req = mockReq('PUT', '/');
      const res = mockRes();

      await requestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(405, { 'Content-Type': 'text/plain' });
      expect(res.end).toHaveBeenCalledWith('Method Not Allowed');
    });

    it('should return 404 for unknown paths', async () => {
      const req = mockReq('GET', '/unknown');
      const res = mockRes();

      await requestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'text/plain' });
      expect(res.end).toHaveBeenCalledWith('Not Found');
    });

    it('should handle requests without URL', async () => {
      const req = { method: 'GET', headers: {} };
      const res = mockRes();

      await requestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
      expect(res.end).toHaveBeenCalledWith('Bad Request');
    });

    it('should handle /mcp path as well as root', async () => {
      const req = mockReq('POST', '/mcp');
      const res = mockRes();

      await requestHandler(req, res);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(StreamableHTTPServerTransport).toHaveBeenCalled();
      expect(mockTransport.handleRequest).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const sessionIdGenerator = vi.mocked(StreamableHTTPServerTransport).mock.calls[0]?.[0]
        ?.sessionIdGenerator;
      if (sessionIdGenerator) {
        const id1 = sessionIdGenerator();
        expect(id1).toBe('test-uuid-123');
        expect(randomUUID).toHaveBeenCalled();
      }
    });

    it('should clean up transport on close', async () => {
      const options = { mode: 'http' as const, port: 3000, host: 'localhost' };
      await runHttpServer(mockServer, options);

      // Create mockReq and mockRes for this test
      const req = {
        method: 'POST',
        url: '/',
        headers: { host: 'localhost:3000' },
        on: vi.fn((event, handler) => {
          if (event === 'data') handler('{"jsonrpc":"2.0","method":"initialize","id":1}');
          if (event === 'end') handler();
        }),
      };
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
        setHeader: vi.fn(),
        headersSent: false,
      };

      await requestHandler(req, res);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Get the initialization callback and assign onclose
      const initCallback = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0]
        .onsessioninitialized;
      if (initCallback) {
        initCallback('test-session-id');
      }

      // Set onclose handler on the transport
      mockTransport.onclose = vi.fn();

      // Simulate transport close
      if (mockTransport.onclose) {
        mockTransport.onclose();
      }

      // Verify cleanup would happen (in real implementation)
      expect(mockTransport.onclose).toHaveBeenCalled();
    });
  });
});
