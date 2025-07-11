# Sunra MCP Server

A Model Context Protocol (MCP) server for integrating with Sunra.ai's API, built with FastMCP.

## Features

This MCP server provides the following tools for interacting with Sunra.ai:

- **submit** - Submit a request to the Sunra queue for processing
- **status** - Check the status of a request in the Sunra queue
- **result** - Retrieve the result of a completed request from the Sunra queue
- **cancel** - Cancel a request in the Sunra queue
- **subscribe** - Submit a request to the Sunra queue and wait for completion
- **set-sunra-key** - Set the Sunra API key for authentication

## Installation

1. Clone the repository and navigate to the mcp-server directory
2. Install dependencies:

```bash
npm install
```

## Configuration

### Setting up your Sunra API Key

You have two options to configure your Sunra API key:

#### Option 1: Environment Variable
Set the `SUNRA_KEY` environment variable:

```bash
export SUNRA_KEY="your-sunra-api-key-here"
```

#### Option 2: Use the set-sunra-key tool
After the server is running, use the `set-sunra-key` tool to configure your API key.

## Usage

### Development Mode
To run the server in development mode with auto-reload:

```bash
npm run dev
```

### Production Mode
To build and run the server in production:

```bash
npm run build
npm start
```

### Testing with FastMCP CLI
You can test the server using the FastMCP development tools:

```bash
# Test the server
npx fastmcp dev src/index.ts

# Inspect the server with web UI
npx fastmcp inspect src/index.ts
```

## Connecting to Claude Desktop

To use this MCP server with Claude Desktop, add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "SUNRA_KEY": "your-sunra-api-key-here"
      }
    }
  }
}
```

Or for development:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "path/to/mcp-server",
      "env": {
        "SUNRA_KEY": "your-sunra-api-key-here"
      }
    }
  }
}
```

## API Reference

### submit
Submit a request to the Sunra queue for processing.

**Parameters:**
- `endpointId` (string): The ID of the API endpoint to submit to
- `input` (any, optional): The input data to send to the endpoint
- `webhookUrl` (string, optional): Optional webhook URL to receive completion notifications

### status
Check the status of a request in the Sunra queue.

**Parameters:**
- `requestId` (string): The unique identifier for the request
- `logs` (boolean, optional): Whether to include logs in the response (default: false)

### result
Retrieve the result of a completed request from the Sunra queue.

**Parameters:**
- `requestId` (string): The unique identifier for the request

### cancel
Cancel a request in the Sunra queue.

**Parameters:**
- `requestId` (string): The unique identifier for the request to cancel

### subscribe
Submit a request to the Sunra queue and wait for completion.

**Parameters:**
- `endpointId` (string): The ID of the API endpoint to submit to
- `input` (any, optional): The input data to send to the endpoint
- `mode` (string, optional): The mode to use for subscribing ('polling' or 'streaming', default: 'polling')
- `pollInterval` (number, optional): The interval in milliseconds for polling (default: 1000)
- `timeout` (number, optional): The timeout in milliseconds for the request
- `logs` (boolean, optional): Whether to include logs in the response (default: false)
- `webhookUrl` (string, optional): Optional webhook URL to receive completion notifications

### set-sunra-key
Set the Sunra API key for authenticating with the Sunra.ai service.

**Parameters:**
- `apiKey` (string): The Sunra API key to configure

## License

Apache-2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 
