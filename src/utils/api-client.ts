import type { MiteApiError, MiteConfig } from '../types/index.js';

export class MiteApiClient {
  private baseUrl: string;
  private _headers: Record<string, string>;

  get headers(): Record<string, string> {
    return this._headers;
  }

  constructor(config: MiteConfig) {
    this.baseUrl = `https://${config.accountName}.mite.de`;
    this._headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'mite-mcp/0.1.0',
    };

    if (config.apiKey) {
      this._headers['X-MiteApiKey'] = config.apiKey;
    } else if (config.email && config.password) {
      const auth = Buffer.from(`${config.email}:${config.password}`).toString('base64');
      this._headers.Authorization = `Basic ${auth}`;
    }
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    queryParams?: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const options: RequestInit = {
      method,
      headers: this._headers,
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), options);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          error: 'Unknown error',
          message: response.statusText,
        }))) as MiteApiError;

        throw new Error(`API Error (${response.status}): ${errorData.message || errorData.error}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  async get<T>(path: string, queryParams?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('GET', path, undefined, queryParams);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete(path: string): Promise<void> {
    await this.request<void>('DELETE', path);
  }
}
