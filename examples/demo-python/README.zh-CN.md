# Python 示例演示

[English](./README.md) | 简体中文

[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

本目录包含多个示例，演示如何使用 sunra-client Python 库。

## 设置

在运行任何示例之前，请确保您已：

1. 安装 sunra-client 库：
   ```bash
   pip install sunra-client
   ```

2. 获取您的 API 密钥：
   - 在 [sunra.ai](https://sunra.ai) 注册
   - 从[仪表板](https://sunra.ai/dashboard/keys)获取您的 API 密钥

3. 将您的 API 密钥设置为环境变量：
   ```bash
   export SUNRA_KEY=your-api-key-here
   ```

## 示例

### 基础示例

- **`text-to-image.py`** - 基本的文本到图像生成
- **`image-to-image.py`** - 图像到图像转换
- **`text-to-video.py`** - 文本到视频生成
- **`image-to-video.py`** - 图像到视频转换
- **`speech-to-text.py`** - 语音到文本转换

### 输入转换示例

以下示例演示了自动文件上传和转换功能：

- **`transform-input-example.py`** - 自动文件/图像转换的综合演示
- **`transform-base64-input.py`** - 使用自动上传的 base64 数据 URI 的实际工作示例

#### 输入转换功能

当您调用 `submit()` 或 `subscribe()` 时，Python SDK 会自动上传和转换各种输入类型：

- **PIL Image 对象** → 上传到 CDN，替换为 URL
- **Base64 数据 URI** → 解码、上传、替换为 URL
- **文件路径** → 上传文件内容，替换为 URL
- **类文件对象** → 上传内容，替换为 URL
- **嵌套结构** → 递归处理列表和字典

#### 使用示例

```python
import sunra_client
from PIL import Image

# 创建或加载图像
image = Image.open("photo.jpg")

# Base64 数据 URI
base64_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."

# 直接传递它们 - 自动上传和转换！
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "Make it artistic",
        "image": image,  # ← PIL Image 自动上传！
        "reference": base64_image,  # ← 数据 URI 自动上传！
    }
)
```

**无需手动上传步骤！** SDK 自动处理所有内容。

### 配置示例

以下示例演示了用于设置 API 凭据的新 `config()` 函数：

- **`config-example.py`** - 展示如何使用 `sunra_client.config()` 设置凭据
- **`config-switching-example.py`** - 演示在不同 API 密钥之间切换
- **`config-comparison.py`** - 比较设置凭据的不同方法

### 配置方法

sunra-client 支持三种配置 API 凭据的方式：

#### 1. 环境变量（默认）
```bash
export SUNRA_KEY=your-api-key
```
```python
import sunra_client
# 客户端自动使用环境中的 SUNRA_KEY
client = sunra_client.SyncClient()
```

#### 2. 全局配置（新）
```python
import sunra_client
# 全局设置凭据
sunra_client.config(credentials="your-api-key")
# 所有客户端都将使用这些凭据
client = sunra_client.SyncClient()
```

#### 3. 显式客户端配置
```python
import sunra_client
# 直接向客户端传递凭据
client = sunra_client.SyncClient(key="your-api-key")
```

### 优先级顺序

当使用多种配置方法时，优先级为：
1. **显式客户端密钥**（最高优先级）
2. **全局配置**（通过 `sunra_client.config()`）
3. **环境变量**（最低优先级）

### 运行示例

要运行任何示例：

```bash
python text-to-image.py
python config-example.py
python config-comparison.py
```

### config() 的使用场景

`config()` 函数特别适用于：

- **动态凭据管理** - 以编程方式在不同的 API 密钥之间切换
- **库开发** - 在构建包装 sunra 客户端的库时
- **测试环境** - 轻松在开发和生产密钥之间切换
- **容器化应用程序** - 避免环境变量依赖
- **Web 应用程序** - 根据用户上下文或配置文件设置凭据

## 注意事项

- 所有示例都从 `SUNRA_KEY` 环境变量读取 API 密钥
- 配置示例演示了新配置系统的灵活性
- 无论如何配置凭据，实际的 API 请求都是相同的
