#!/usr/bin/env node

import { FastMCP } from 'fastmcp';

import { submitTool } from './tools/base/submit';
import { statusTool } from './tools/base/status';
import { resultTool } from './tools/base/result';
import { cancelTool } from './tools/base/cancel';
import { subscribeTool } from './tools/base/subscribe';
import { setSunraKeyTool } from './tools/base/set-sunra-key';
import { uploadTool } from './tools/base/upload';
import { listModelsTool } from './tools/base/list-models';
import { searchModelsTool } from './tools/base/search-models';
import { modelSchemaTool } from './tools/base/model-schema';

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

// Start the server
server.start({
  transportType: 'stdio'
});
