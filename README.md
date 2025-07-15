# mite MCP Server

Model Context Protocol server for the mite time tracking API.

[**mite**](https://mite.de/) – Simple time tracking for teams

## Prerequisites

- Node.js 18+
- mite account with API access enabled
- mite API key (recommended) or email/password

## Installation

```bash
npm install -g @marceloemmerich/mite-mcp
```

Or use directly with npx:

```bash
npx @marceloemmerich/mite-mcp
```

## Configuration

### For Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```bash
   MITE_ACCOUNT_NAME=your-account-name
   MITE_API_KEY=your-api-key
   ```

### For Production

Set the following environment variables:

```bash
# Required
MITE_ACCOUNT_NAME=your-account-name

# Authentication (use one of these)
MITE_API_KEY=your-api-key  # Recommended

# OR
MITE_EMAIL=your-email@example.com
MITE_PASSWORD=your-password
```

### Getting your mite API Key

1. Log into your mite account
2. Go to Settings > My User
3. Under "API Key", click "Display API Key"
4. Copy the key and set it as `MITE_API_KEY`

## Available Tools

### Time Entries

- `list_time_entries` - List time entries with optional filters
- `get_daily_time_entries` - Get time entries for today or a specific date
- `get_time_entry` - Get a specific time entry by ID
- `create_time_entry` - Create a new time entry
- `update_time_entry` - Update an existing time entry
- `delete_time_entry` - Delete a time entry

### Stopwatch

- `get_stopwatch_status` - Get current stopwatch status
- `start_stopwatch` - Start tracking time for an entry
- `stop_stopwatch` - Stop the currently running stopwatch
- `quick_start_stopwatch` - Create and start tracking a new entry

### Customers

- `list_customers` - List active or archived customers
- `get_customer` - Get a specific customer
- `create_customer` - Create a new customer (admin only)
- `update_customer` - Update a customer (admin only)
- `delete_customer` - Delete a customer (admin only)

### Projects

- `list_projects` - List active or archived projects
- `get_project` - Get a specific project
- `create_project` - Create a new project (admin only)
- `update_project` - Update a project (admin only)
- `delete_project` - Delete a project (admin only)

### Services

- `list_services` - List active or archived services
- `get_service` - Get a specific service
- `create_service` - Create a new service (admin only)
- `update_service` - Update a service (admin only)
- `delete_service` - Delete a service (admin only)

## Usage

### MCP Server Modes

The mite MCP server supports two modes:

#### 1. Stdio Mode (Default)
For use with Claude Desktop and other MCP clients that use stdio transport:

```bash
# Default stdio mode
npx @marceloemmerich/mite-mcp

# Explicitly specify stdio mode
npx @marceloemmerich/mite-mcp --stdio
```

#### 2. HTTP/Streamable Mode
For web-based clients or testing environments:

```bash
# HTTP/Streamable mode on default port 3000
npx @marceloemmerich/mite-mcp --http

# HTTP/Streamable mode on custom port and host
npx @marceloemmerich/mite-mcp --http --port 8080 --host 0.0.0.0
```

**HTTP Endpoints:**
- `POST /` - Handles MCP JSON-RPC requests
- `GET /` - Establishes SSE stream (requires Mcp-Session-Id header)
- `DELETE /` - Terminates session (requires Mcp-Session-Id header)


### CLI Options

```bash
mite-mcp [options]

Options:
  -V, --version      output the version number
  --stdio            Run in stdio mode (default)
  --http             Run in HTTP/Streamable mode
  -p, --port <port>  Port for HTTP server (default: 3000)
  -h, --host <host>  Host for HTTP server (default: localhost)
  --help             display help for command
```

### Claude Desktop Configuration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mite": {
      "command": "npx",
      "args": ["@marceloemmerich/mite-mcp"],
      "env": {
        "MITE_ACCOUNT_NAME": "your-account-name",
        "MITE_API_KEY": "your-api-key"
      }
    }
  }
}
```

For development testing with Claude Desktop, you can also use:

```json
{
  "mcpServers": {
    "mite-dev": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/mite-mcp",
      "env": {
        "MITE_ACCOUNT_NAME": "your-account-name",
        "MITE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/marceloemmerich/mite-mcp.git
cd mite-mcp

# Install dependencies
npm install

# Run in development mode (stdio)
npm run dev

# Run in HTTP/Streamable mode for testing
npm run dev -- --http --port 3000

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Lint and format code
npm run lint:fix
```

### Testing HTTP/Streamable Mode

For testing the HTTP/Streamable server mode, you can use tools like:

```bash
# Test initialization (this will return a session ID)
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"roots":{"listChanged":true},"sampling":{}}},"id":1}'

# Test with session ID (replace SESSION_ID with the actual session ID from initialization)
curl -X GET http://localhost:3000/ \
  -H "Mcp-Session-Id: SESSION_ID"
```

### Development with Claude Desktop

For local development, update your Claude Desktop config:

```json
{
  "mcpServers": {
    "mite-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/mite-mcp",
      "env": {
        "MITE_ACCOUNT_NAME": "your-account-name",
        "MITE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## API Documentation

For detailed mite API documentation, visit: https://mite.de/api/

## License

MIT