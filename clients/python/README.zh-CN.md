# sunra.ai Python 客户端

[English](./README.md) | 简体中文

这是一个用于与部署在 [sunra.ai](https://sunra.ai) 上的机器学习模型进行交互的 Python 客户端库。

## 社区

加入我们的 [Discord 社区](https://discord.gg/W9F3tveq)，与其他开发者联系、获取帮助，并随时了解最新的功能和公告。

## 入门

要安装客户端，请运行：

```bash
pip install sunra-client
```

在使用客户端之前，您需要：

1. 在 [sunra.ai](https://sunra.ai) 注册
2. 从 [仪表板](https://sunra.ai/dashboard/keys) 获取您的 API 密钥
3. 将您的 API 密钥设置为环境变量：`export SUNRA_KEY=your-api-key` 

## 配置

有两种方法可以配置您的 API 密钥：

### 方法一：全局配置 (推荐)

```python
import sunra_client

# 使用您的 API 密钥配置客户端
sunra_client.config(credentials="your-api-key")

# 现在您可以直接使用客户端，无需显式传递密钥
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={"prompt": "a cute cat, realistic, orange"}
)
```

### 方法二：环境变量

将您的 API 密钥设置为环境变量：

```bash
export SUNRA_KEY=your-api-key
```

### 方法三：显式客户端配置

```python
import sunra_client

# 创建一个带有显式 API 密钥的客户端
client = sunra_client.SyncClient(key="your-api-key")

# 或者对于异步客户端
async_client = sunra_client.AsyncClient(key="your-api-key")
```

## 使用示例

现在您可以使用客户端与您的模型进行交互。以下是一个使用示例：

```python
import sunra_client

response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={
      "prompt": "a cute cat, realistic, orange"
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print
)
print(response["images"][0]["url"])
```

## 流式响应

您可以在处理请求时流式传输实时更新：

```python
import sunra_client

application = "black-forest-labs/flux-kontext-pro/text-to-image"
arguments = {"prompt": "a cute cat, realistic, orange"}

for event in sunra_client.stream(application, arguments):
    print(f"收到事件: {event}")
```

## 异步请求

该客户端还支持开箱即用的异步请求。以下是一个示例：

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.subscribe_async(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "a cute cat, realistic, orange"}
        with_logs=True,
        on_enqueue=print,
        on_queue_update=print
    )
    print(response["images"][0]["url"])

asyncio.run(main())
```

## 排队请求

当您想发送一个请求并持续接收其状态更新时，可以使用 `submit` 方法：

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.submit_async(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "a cute cat, realistic, orange"}
    )

    async for event in response.iter_events():
        if isinstance(event, sunra_client.Queued):
            print("已排队. 位置:", event.position)
        elif isinstance(event, (sunra_client.InProgress, sunra_client.Completed)):
            print(event)

    result = await response.get()
    print(result["images"][0]["url"])

asyncio.run(main())
```

## 文件上传支持

客户端支持将文件上传到 sunra.ai：

```python
import sunra_client
import io

# 建议一次性配置客户端，
# 最好在应用程序的中心部分进行。
# 这样您就不必每次都传递密钥。
sunra_client.config(credentials="your-api-key")


# 从本地路径上传文件
# 内容类型将根据文件扩展名推断
file_url = sunra_client.upload_file("path/to/your/image.jpg")

# 上传原始二进制数据，例如来自内存中的图像
with open("path/to/your/image.png", "rb") as f:
    image_data = f.read()

data_url = sunra_client.upload(
    data=image_data,
    content_type="image/png",
)

# 然后，您可以将返回的 URL 用作模型的输入
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "image": file_url,
        "prompt": "a cat",
    },
)

```

**文件上传限制：**
- 最大文件大小：**100MB**
- 支持格式：图像、视频、音频、文档以及特定模型支持的其他文件类型

## 自动输入转换

当您调用 `submit()` 或 `subscribe()` 时，Python SDK 会自动转换文件输入。这意味着您可以直接在输入参数中传递各种文件类型，它们将被自动上传并替换为 URL。

### 支持的输入类型

SDK 自动处理：

- **PIL Image 对象** - 自动上传为图像
- **Base64 数据 URI** - 解码并以上传适当的内容类型  
- **文件路径** - 本地文件上传到 CDN
- **类文件对象** - 具有 `read()` 方法的对象 (例如 `io.BytesIO`，打开的文件句柄)

### 自动转换示例

```python
import sunra_client
from PIL import Image
import io

# 建议一次性配置客户端。
sunra_client.config(credentials="your-api-key")

# 创建一个示例 PIL 图像
image = Image.new("RGB", (1024, 1024), color="purple")

# 您可以直接传递图像 - 它将被自动上传
# 并且输入将更新为返回的 URL。
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "A purple square",
        "image": image,  # SDK 将上传此 PIL 图像
    }
)
```

### 手动输入转换

如果需要，您还可以手动转换输入：

```python
# 对于异步客户端
async_client = sunra_client.AsyncClient()
transformed = await async_client.transform_input({
    "image": pil_image,
    "files": ["file1.txt", "file2.jpg"],
    "data": data_uri,
    "metadata": {"nested": {"file": "path/to/file.pdf"}}
})

# 对于同步客户端
sync_client = sunra_client.SyncClient()
transformed = sync_client.transform_input({
    "image": pil_image,
    "document": "path/to/document.pdf"
})
```

### 嵌套对象支持

转换递归地作用于嵌套对象和数组：

```python
input_data = {
    "prompt": "Process these images",
    "images": [image1, image2, image3],  # 所有 PIL 图像都将被上传
    "settings": {
        "reference": "path/to/reference.jpg",  # 嵌套的文件路径将被上传
        "masks": [mask1_data_uri, mask2_data_uri]  # 嵌套的数据 URI 将被上传
    }
}

# 提交时，所有文件输入都将被自动转换。
```
实际模型示例：

```python
import sunra_client
from PIL import Image

sunra_client.config(credentials="your-api-key")

# 创建一个示例 PIL 图像
image = Image.new("RGB", (512, 512), color = 'red')

# 提交时，所有类文件输入都将被自动转换
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "A red square",
        "image": image,
    }
)

print(response)
```

## 错误处理

客户端提供了全面的错误处理和详细的错误信息：

```python
import sunra_client

try:
    response = sunra_client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "a cute cat, realistic, orange",
            "seed": -2  # 无效的 seed (应 >= 0)
        },
        with_logs=True,
        on_enqueue=print,
        on_queue_update=print
    )
    print(response["images"][0]["url"])
    
except sunra_client.SunraClientError as e:
    print(f"错误: {e}")
    
    # 访问详细的错误信息
    print(f"错误代码: {e.code}")           # 例如 "invalid_input"
    print(f"错误消息: {e.message}")     # 例如 "Validation error: seed must be >= 0"
    print(f"错误详情: {e.details}")     # 额外的错误详情
    print(f"时间戳: {e.timestamp}")       # 错误发生的时间
```

### 错误类型

客户端处理不同类型的错误：

**验证错误** (来自模型处理)：
```python
try:
    response = sunra_client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "test", "seed": -1}  # 无效的 seed
    )
except sunra_client.SunraClientError as e:
    # e.code: "invalid_input"
    # e.message: "Validation error: seed must be >= 0"
    pass
```

**HTTP 错误** (来自 API 请求)：
```python
try:
    response = sunra_client.subscribe(
        "non-existent-model/endpoint",
        arguments={"prompt": "test"}
    )
except sunra_client.SunraClientError as e:
    # e.code: "Bad Request"
    # e.message: "Model endpoint is required"
    # e.timestamp: "2025-01-16T12:00:00.000Z"
    pass
```

**条件错误处理**:
```python
try:
    response = sunra_client.subscribe("model/endpoint", arguments={})
except sunra_client.SunraClientError as e:
    if e.code == "invalid_input":
        print("请检查您的输入参数")
    elif e.code == "Bad Request":
        print("无效的 API 请求")
    else:
        print(f"意外错误: {e}")
```

## 致谢

该项目源自：

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

并已适配以与 sunra.ai 协同工作。原始项目根据 MIT/Apache 2.0 许可证授权。我们对原始作者的贡献表示感谢。

