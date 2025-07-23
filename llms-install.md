# Sunra MCP Server Installation Guide

The Sunra MCP Server provides tools for interacting with Sunra.ai services through the Model Context Protocol (MCP).

## Prerequisites

- Node.js 18.0.0 or higher
- A Sunra.ai API key (get one from [https://sunra.ai/dashboard/api-tokens](https://sunra.ai/dashboard/api-tokens))

## Installation

### Quick Start

The server is published to npm and can be used directly with npx:

```bash
npx @sunra/mcp-server --help
```

### Environment Setup

Set your Sunra.ai API key as an environment variable:

```bash
export SUNRA_KEY="your-api-key-here"
```

Or add it to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
echo 'export SUNRA_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

## Client Configuration

### Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "command": "npx",
      "args": ["@sunra/mcp-server"],
      "env": {
        "SUNRA_KEY": "${SUNRA_KEY}"
      }
    }
  }
}
```

### Cursor IDE

Add the following to your `.cursor/mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "command": "npx",
      "args": ["@sunra/mcp-server"],
      "env": {
        "SUNRA_KEY": "${SUNRA_KEY}"
      }
    }
  }
}
```

### Continue IDE

Add the following to your Continue configuration:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "command": "npx",
      "args": ["@sunra/mcp-server"],
      "env": {
        "SUNRA_KEY": "${SUNRA_KEY}"
      }
    }
  }
}
```

### Other MCP Clients

For other MCP clients that support stdio transport:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "command": "npx",
      "args": ["@sunra/mcp-server"],
      "env": {
        "SUNRA_KEY": "${SUNRA_KEY}"
      }
    }
  }
}
```

## Manual HTTP Server (Advanced)

If you need to run the server manually with HTTP transport (not recommended for normal use):

```bash
# Start the server manually
npx @sunra/mcp-server --transport http --port 3925

# Then connect using a custom HTTP client
# (This is NOT the standard MCP approach)
```

## Manual Installation

If you prefer to install globally:

```bash
npm install -g @sunra/mcp-server
```

Then use `sunra-mcp-server` instead of `npx @sunra/mcp-server` in your configurations.

## Configuration Options

The server supports the following command-line options:

- `--transport` or `-t`: Transport type (`stdio` or `http`, default: `stdio`)
- `--port` or `-p`: Port for HTTP transport (default: `3000`)
- `--host` or `-h`: Host for HTTP transport (default: `localhost`)
- `--help`: Show help message

### Examples

```bash
# Default stdio transport (for Claude Desktop)
npx @sunra/mcp-server

# HTTP transport on default port 3000
npx @sunra/mcp-server --transport http

# HTTP transport on custom port
npx @sunra/mcp-server --transport http --port 8080

# Custom host and port
npx @sunra/mcp-server --transport http --host 0.0.0.0 --port 8080
```

## Available Tools

Once installed, the server provides the following tools:

### Base Operations
- `submit` - Submit a request to a model endpoint
- `status` - Check the status of a request
- `result` - Get the result of a completed request
- `cancel` - Cancel a pending request
- `subscribe` - Submit and wait for completion

### Model Management
- `list-models` - List all available models
- `search-models` - Search for models by name or description
- `model-schema` - Get input/output schema for a model

### File Management
- `upload` - Upload files to Sunra.ai

### Authentication
- `set-sunra-key` - Set API key at runtime

## Troubleshooting

### Common Issues

1. **"SUNRA_KEY is not configured"**
   - Make sure your API key is set in the environment
   - Use the `set-sunra-key` tool to configure it at runtime

2. **"Command not found: npx"**
   - Install Node.js from [nodejs.org](https://nodejs.org)
   - Ensure npm is properly installed

3. **"Permission denied"**
   - On macOS/Linux, you may need to use `sudo` for global installation
   - Or use a Node.js version manager like nvm

4. **"Port already in use"**
   - Change the port using `--port` option
   - Check if another process is using the port

### Getting Help

- Check the [Sunra.ai documentation](https://docs.sunra.ai)
- Report issues on [GitHub](https://github.com/sunra-ai/sunra-clients/issues)
- Join our community Discord (link in documentation)

## Development

For local development:

```bash
git clone https://github.com/sunra-ai/sunra-clients.git
cd sunra-clients/mcp-server
npm install
npm run build
npm start
```

## License

Apache 2.0 License - see the [LICENSE](LICENSE) file for details. 
