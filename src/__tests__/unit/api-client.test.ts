import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MiteConfig } from '../../types/index.js';
import { MiteApiClient } from '../../utils/api-client.js';

global.fetch = vi.fn();

describe('MiteApiClient', () => {
  const mockConfig: MiteConfig = {
    accountName: 'testaccount',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set up headers with API key', () => {
      const client = new MiteApiClient(mockConfig);

      expect(client.headers).toMatchObject({
        'Content-Type': 'application/json',
        'User-Agent': 'mite-mcp/0.1.0',
        'X-MiteApiKey': 'test-api-key',
      });
    });

    it('should set up headers with basic auth', () => {
      const configWithAuth: MiteConfig = {
        accountName: 'testaccount',
        email: 'test@example.com',
        password: 'password123',
      };

      const client = new MiteApiClient(configWithAuth);
      const expectedAuth = Buffer.from('test@example.com:password123').toString('base64');

      expect(client.headers).toMatchObject({
        'Content-Type': 'application/json',
        'User-Agent': 'mite-mcp/0.1.0',
        Authorization: `Basic ${expectedAuth}`,
      });
    });
  });

  describe('request method', () => {
    let client: MiteApiClient;

    beforeEach(() => {
      client = new MiteApiClient(mockConfig);
    });

    it('should make GET request with query parameters', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.get('/test', { param1: 'value1', param2: 123 });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://testaccount.mite.de/test?param1=value1&param2=123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-MiteApiKey': 'test-api-key',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request with body', async () => {
      const mockResponse = { id: 1 };
      const requestBody = { name: 'Test' };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await client.post('/test', requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://testaccount.mite.de/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle 204 No Content response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      const result = await client.delete('/test/123');

      expect(result).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        error: 'Not Found',
        message: 'Resource not found',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorResponse,
      } as Response);

      await expect(client.get('/test')).rejects.toThrow('API Error (404): Resource not found');
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/test')).rejects.toThrow('Network error');
    });

    it('should filter undefined query parameters', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      } as Response);

      await client.get('/test', {
        param1: 'value1',
        // biome-ignore lint/suspicious/noExplicitAny: Testing undefined filtering
        param2: undefined as any,
        // biome-ignore lint/suspicious/noExplicitAny: Testing null filtering
        param3: null as any,
        param4: false,
        param5: 0,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('param1=value1'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('param2'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('param3'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('param4=false'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('param5=0'),
        expect.anything()
      );
    });
  });
});
