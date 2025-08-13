# Sunra MCP 服务器

[English](./README.md) | 简体中文

[![npm package](https://img.shields.io/npm/v/@sunra/mcp-server?style=flat-square&color=%237527D7&label=npm)](https://www.npmjs.com/package/@sunra/mcp-server)
[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

一个提供与 Sunra.ai 服务交互工具的模型上下文协议（MCP）服务器。

## 安装

### 从 npm 安装（推荐）

```bash
npx @sunra/mcp-server --help
```

### 本地开发

```bash
git clone https://github.com/sunra-ai/sunra-clients.git
cd sunra-clients/mcp-server
npm install
npm run build
```

## 使用方法

### 命令行选项

```bash
sunra-mcp-server [options]

选项：
  -t, --transport <type>   传输类型：'stdio' 或 'http'（默认：stdio）
  -p, --port <number>      HTTP 传输的端口（默认：3000）
  -h, --host <string>      HTTP 传输的主机（默认：localhost）
  --help                   显示帮助信息

示例：
  sunra-mcp-server                           # 使用 stdio 传输启动
  sunra-mcp-server --transport http          # 使用 HTTP 传输在端口 3000 启动
  sunra-mcp-server -t http -p 8080           # 使用 HTTP 传输在端口 8080 启动
```

### 对于 Cursor IDE

在您的 `.cursor/mcp.json` 文件中添加以下内容：

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

### 对于 Claude Desktop

在您的 Claude Desktop 配置文件中添加以下内容：

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

## 功能特性

- **基础工具**：提交、状态查询、结果获取、取消、订阅操作
- **模型管理**：列出、搜索和获取 AI 模型的模式信息
- **文件管理**：上传文件到 Sunra.ai
- **身份验证**：安全的 API 密钥管理
- **多种传输方式**：支持 stdio（用于 Claude Desktop）和 HTTP（用于 Cursor）

## 工具

### 基础操作

- `submit` - 向模型端点提交请求
- `status` - 检查请求状态
- `result` - 获取已完成请求的结果
- `cancel` - 取消待处理的请求
- `subscribe` - 提交并等待完成

### 模型管理

- `list-models` - 列出所有可用模型
- `search-models` - 按名称或描述搜索模型
- `model-schema` - 获取特定模型端点的输入和输出模式

### 文件管理

- `upload` - 上传文件到 Sunra.ai 存储

### 身份验证

- `set-sunra-key` - 配置您的 Sunra.ai API 密钥

## 使用示例

### 模型模式工具

`model-schema` 工具现在接受格式为 `owner/model/endpoint` 的模型标识符，并仅返回输入和输出模式：

```bash
# 获取特定模型端点的模式
model-schema --modelSlug "black-forest-labs/flux-kontext-max/text-to-image"
```

#### 引用解析

该工具会自动解析 OpenAPI 的 `$ref` 引用以提供完全展开的模式。例如，如果原始 OpenAPI 模式包含：

```json
{
  "schema": {
    "$ref": "#/components/schemas/TextToVideoInput"
  }
}
```

工具将解析此引用并返回实际的模式定义：

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "用于视频生成的文本提示"
      },
      "duration": {
        "type": "integer",
        "enum": [5, 10],
        "description": "视频时长（秒）"
      }
    },
    "required": ["prompt"]
  }
}
```

工具支持：
- ✅ 简单引用（`#/components/schemas/SchemaName`）
- ✅ 对象和数组中的嵌套引用
- ✅ 循环引用（标记为 `$circular: true`）
- ✅ 缺失引用（优雅地回退到原始 `$ref`）

#### 响应格式

响应格式：
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
        "description": "用于图像生成的文本提示"
      }
    },
    "required": ["prompt"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "description": "请求 ID"
      },
      "status": {
        "type": "string",
        "description": "请求状态"
      },
      "output": {
        "type": "object",
        "description": "生成的输出"
      }
    }
  }
}
```

## 开发

### 运行测试

```bash
npm test
```

### 构建

```bash
npm run build
```

### 启动服务器

```bash
npm start
```

## 配置

将您的 Sunra.ai API 密钥设置为环境变量：

```bash
export SUNRA_KEY="your-api-key-here"
```

或在运行时使用 `set-sunra-key` 工具。

## 发布

发布到 npm：

```bash
npm run build
npm publish
```

## API 参考

有关详细的 API 文档，请参阅 [Sunra.ai API 文档](https://docs.sunra.ai/)。
