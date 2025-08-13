# Sunra MCP Server

[English](./README.md) | [简体中文](./README.zh-CN.md)

[![npm package](https://img.shields.io/npm/v/@sunra/mcp-server?style=flat-square&color=%237527D7&label=npm)](https://www.npmjs.com/package/@sunra/mcp-server)
[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

A Model Context Protocol (MCP) server that provides tools for interacting with Sunra.ai services.

## Installation

### From npm (Recommended)

```bash
npx @sunra/mcp-server --help
```

### Local Development

```bash
git clone https://github.com/sunra-ai/sunra-clients.git
cd sunra-clients/mcp-server
npm install
npm run build
```

## Usage

### Command Line Options

```bash
sunra-mcp-server [options]

Options:
  -t, --transport <type>   Transport type: 'stdio' or 'http' (default: stdio)
  -p, --port <number>      Port for HTTP transport (default: 3000)
  -h, --host <string>      Host for HTTP transport (default: localhost)
  --help                   Show this help message

Examples:
  sunra-mcp-server                           # Start with stdio transport
  sunra-mcp-server --transport http          # Start with HTTP transport on port 3000
  sunra-mcp-server -t http -p 8080           # Start with HTTP transport on port 8080
```

### For Cursor IDE

Add the following to your `.cursor/mcp.json` file:

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

### For Claude Desktop

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

## Features

- **Base Tools**: Submit, status, result, cancel, subscribe operations
- **Model Management**: List, search, and get schema information for AI models
- **File Management**: Upload files to Sunra.ai
- **Authentication**: Secure API key management
- **Multiple Transports**: Supports both stdio (for Claude Desktop) and HTTP (for Cursor)

## Tools

### Base Operations

- `submit` - Submit a request to a model endpoint
- `status` - Check the status of a request
- `result` - Get the result of a completed request
- `cancel` - Cancel a pending request
- `subscribe` - Submit and wait for completion

### Model Management

- `list-models` - List all available models
- `search-models` - Search for models by name or description
- `model-schema` - Get input and output schemas for a specific model endpoint

### File Management

- `upload` - Upload files to Sunra.ai storage

### Authentication

- `set-sunra-key` - Configure your Sunra.ai API key

## Usage Examples

### Model Schema Tool

The `model-schema` tool now accepts a model slug in the format `owner/model/endpoint` and returns only the input and output schemas:

```bash
# Get schema for a specific model endpoint
model-schema --modelSlug "black-forest-labs/flux-kontext-max/text-to-image"
```

#### Reference Resolution

The tool automatically resolves OpenAPI `$ref` references to provide fully expanded schemas. For example, if the original OpenAPI schema contains:

```json
{
  "schema": {
    "$ref": "#/components/schemas/TextToVideoInput"
  }
}
```

The tool will resolve this reference and return the actual schema definition:

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "Text prompt for video generation"
      },
      "duration": {
        "type": "integer",
        "enum": [5, 10],
        "description": "Duration of the video in seconds"
      }
    },
    "required": ["prompt"]
  }
}
```

The tool handles:
- ✅ Simple references (`#/components/schemas/SchemaName`)
- ✅ Nested references within objects and arrays
- ✅ Circular references (marked with `$circular: true`)
- ✅ Missing references (graceful fallback to original `$ref`)

#### Response Format

Response format:
```json
{
  "success": true,
  "modelSlug": "black-forest-labs/flux-kontext-max/text-to-image",
  "owner": "black-forest-labs",
  "model": "flux-kontext-max",
  "endpoint": "text-to-image",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "Text prompt for image generation"
      }
    },
    "required": ["prompt"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "description": "Request ID"
      },
      "status": {
        "type": "string",
        "description": "Request status"
      },
      "output": {
        "type": "object",
        "description": "Generated output"
      }
    }
  }
}
```

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

### Starting the Server

```bash
npm start
```

## Configuration

Set your Sunra.ai API key as an environment variable:

```bash
export SUNRA_KEY="your-api-key-here"
```

Or use the `set-sunra-key` tool at runtime.

## Publishing

To publish to npm:

```bash
npm run build
npm publish
```

## API Reference

For detailed API documentation, see the [Sunra.ai API documentation](https://docs.sunra.ai/). 
