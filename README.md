# mite MCP Server

Model Context Protocol server for the mite time tracking API.

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

## Usage with Claude Desktop

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

## Development

```bash
# Clone the repository
git clone https://github.com/marceloemmerich/mite-mcp.git
cd mite-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## API Documentation

For detailed mite API documentation, visit: https://mite.de/api/

## License

MIT