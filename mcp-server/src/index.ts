#!/usr/bin/env node

import { FastMCP } from 'fastmcp';

import { submitTool } from './tools/base/submit.js';
import { statusTool } from './tools/base/status.js';
import { resultTool } from './tools/base/result.js';
import { cancelTool } from './tools/base/cancel.js';
import { subscribeTool } from './tools/base/subscribe.js';
import { setSunraKeyTool } from './tools/base/set-sunra-key.js';
import { uploadTool } from './tools/base/upload.js';
import { listModelsTool } from './tools/base/list-models.js';
import { searchModelsTool } from './tools/base/search-models.js';
import { modelSchemaTool } from './tools/base/model-schema.js';

// Parse command line arguments
function parseArgs(): { transport: 'stdio' | 'httpStream'; port: number; host: string } {
  const args = process.argv.slice(2);
  let transport: 'stdio' | 'httpStream' = 'stdio';
  let port = 3000;
  let host = 'localhost';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--transport':
      case '-t':
        const transportValue = args[i + 1];
        if (transportValue === 'http' || transportValue === 'httpStream') {
          transport = transportValue === 'http' ? 'httpStream' : 'httpStream';
        } else if (transportValue === 'stdio') {
          transport = 'stdio';
        }
        i++;
        break;
      case '--port':
      case '-p':
        const portValue = parseInt(args[i + 1]);
        if (!isNaN(portValue)) {
          port = portValue;
        }
        i++;
        break;
      case '--host':
      case '-h':
        host = args[i + 1];
        i++;
        break;
      case '--help':
        console.log(`
Sunra MCP Server

Usage:
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
`);
        process.exit(0);
    }
  }

  return { transport, port, host };
}

// Create the FastMCP server
const server = new FastMCP({
  name: 'sunra-mcp-server',
  version: '1.0.0',
});

// Register all tools
server.addTool(submitTool);
server.addTool(statusTool);
server.addTool(resultTool);
server.addTool(cancelTool);
server.addTool(subscribeTool);
server.addTool(setSunraKeyTool);
server.addTool(uploadTool);
server.addTool(listModelsTool);
server.addTool(searchModelsTool);
server.addTool(modelSchemaTool);

// Parse arguments and start the server
const { transport, port, host } = parseArgs();

console.error(`Starting Sunra MCP Server with ${transport} transport...`);

if (transport === 'httpStream') {
  console.error(`Server will be available at http://${host}:${port}`);
  server.start({
    transportType: 'httpStream',
    httpStream: {
      port,
    },
  });
} else {
  server.start({
    transportType: 'stdio'
  });
}
