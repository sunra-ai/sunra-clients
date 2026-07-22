# Sunra AI Python SDK - Jupyter 笔记本

[English](./README.md) | 简体中文

[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

欢迎使用 Sunra AI Python SDK Jupyter 笔记本！这个交互式笔记本集合将指导您了解使用 Sunra AI 平台进行 AI 项目的所有方面。

## 📚 笔记本概览

### 01-getting-started.ipynb
**Sunra AI 入门指南**
- 安装和设置
- API 密钥配置
- 基本使用示例
- 环境设置
- 首次图像生成
- 故障排除指南

### 02-text-to-image.ipynb
**掌握文本到图像生成**
- 高级提示工程
- 理解参数（种子、宽高比等）
- 提示增强技术
- 批量生成
- 风格变化
- 性能优化

### 03-image-to-image-and-video.ipynb
**转换图像和创建视频**
- 图像到图像转换
- 图像到视频生成
- 处理输入图像
- 理解强度参数
- 视频生成选项
- 资源 URL 管理

### 04-speech-to-text.ipynb
**将音频转换为文本**
- 语音到文本转录
- 语言支持和检测
- 说话人分离
- 音频事件标记
- 处理不同音频格式
- 高级转录格式化

### 05-advanced-configuration.ipynb
**专业配置管理**
- 多个 API 密钥管理
- 环境特定配置
- 错误处理和重试策略
- 性能监控
- 自定义回调函数
- 生产就绪设置

## 🚀 入门指南

### 前提条件
- Python 3.7 或更高版本
- Jupyter Notebook 或 JupyterLab
- Sunra AI 账户和 API 密钥

### 安装

1. **安装 Jupyter**：
   ```bash
   pip install jupyter
   ```

2. **安装所需包**：
   ```bash
   pip install sunra-client requests pillow matplotlib
   ```

3. **获取 API 密钥**：
   - 在 [sunra.ai](https://sunra.ai) 注册
   - 从[仪表板](https://sunra.ai/dashboard/api-tokens)获取 API 密钥

4. **设置环境变量**：
   ```bash
   export SUNRA_KEY=your-api-key-here
   ```

### 运行笔记本

1. **启动 Jupyter**：
   ```bash
   jupyter notebook
   ```

2. **按顺序打开笔记本**，从 `01-getting-started.ipynb` 开始

3. **跟随交互式示例**进行学习

## 📖 学习路径

### 初学者路径
1. **01-getting-started.ipynb** - 基本设置和第一步
2. **02-text-to-image.ipynb** - 学习基本图像生成
3. **04-speech-to-text.ipynb** - 尝试音频处理

### 中级路径
1. 完成初学者路径
2. **03-image-to-image-and-video.ipynb** - 处理视觉转换
3. **05-advanced-configuration.ipynb** - 专业配置

### 高级路径
1. 完成所有前面的笔记本
2. 尝试自己的用例

## 🎯 按笔记本分类的用例

### 内容创作
- **文本到图像**：生成营销视觉效果、概念艺术、社交媒体内容
- **图像到视频**：创建动画内容、产品演示
- **语音到文本**：转录播客、会议、访谈

### 商业应用
- **自动化工作流**：内容管道、社交媒体自动化
- **多模态处理**：结合文本、图像和音频处理
- **专业工具**：会议转录、内容生成

### 创意项目
- **艺术生成**：数字艺术、概念设计、风格探索
- **内容转换**：风格迁移、格式转换
- **交互式媒体**：动态内容生成

## 🛠️ 技术要求

### 系统要求
- **内存**：建议 4GB+ RAM
- **存储**：1GB+ 可用空间
- **网络**：稳定的互联网连接用于 API 调用

### Python 依赖
```txt
sunra-client>=1.0.0
requests>=2.25.0
pillow>=8.0.0
matplotlib>=3.3.0
jupyter>=1.0.0
```

### 可选依赖
```txt
numpy>=1.19.0
pandas>=1.2.0
seaborn>=0.11.0
```

## 📝 配置选项

### 环境变量
```bash
# 必需
export SUNRA_KEY=your-api-key-here

# 可选 - 用于高级配置
export SUNRA_KEY_DEV=your-dev-api-key
export SUNRA_KEY_STAGING=your-staging-api-key
export SUNRA_KEY_PROD=your-prod-api-key
export ENVIRONMENT=development
```

### Jupyter 配置
创建 `jupyter_config.py` 文件：
```python
# 允许来自所有 IP 的连接（用于远程访问）
c.NotebookApp.ip = '0.0.0.0'

# 设置密码以增加安全性
c.NotebookApp.password = 'your-hashed-password'

# 启用自动保存
c.FileContentsManager.save_script = True
```

## 🔧 故障排除

### 常见问题

**找不到 API 密钥**
```
Error: SUNRA_KEY environment variable not set
```
**解决方案**：将 API 密钥设置为环境变量或在提示时输入。

**导入错误**
```
ModuleNotFoundError: No module named 'sunra_client'
```
**解决方案**：安装所需包：`pip install sunra-client`

**网络超时**
```
Connection timeout error
```
**解决方案**：检查您的互联网连接并重试。某些操作可能需要更长时间。

**图像显示问题**
```
Error displaying image
```
**解决方案**：检查图像 URL 是否可访问并尝试刷新单元格。

### 性能提示

1. **批处理**：使用批处理函数处理多个请求
2. **错误处理**：为生产使用实现重试逻辑
3. **资源管理**：不使用时关闭笔记本
4. **缓存**：本地保存结果以避免重新处理

## 📊 监控和分析

### 内置监控
- 高级笔记本中的请求跟踪
- 性能指标和计时
- 错误率监控
- 使用统计

### 自定义监控
```python
# 监控设置示例
from datetime import datetime
import json

class RequestLogger:
    def __init__(self):
        self.logs = []
    
    def log_request(self, endpoint, arguments, result):
        self.logs.append({
            'timestamp': datetime.now().isoformat(),
            'endpoint': endpoint,
            'arguments': arguments,
            'success': result is not None,
            'result_size': len(str(result)) if result else 0
        })
    
    def get_stats(self):
        return {
            'total_requests': len(self.logs),
            'success_rate': sum(1 for log in self.logs if log['success']) / len(self.logs) if self.logs else 0,
            'avg_result_size': sum(log['result_size'] for log in self.logs) / len(self.logs) if self.logs else 0
        }
```

## 🤝 贡献

我们欢迎对这些笔记本的改进贡献！

### 如何贡献
1. Fork 仓库
2. 创建功能分支
3. 进行改进
4. 彻底测试
5. 提交拉取请求

### 贡献领域
- 额外的用例示例
- 性能优化
- 错误处理改进
- 文档增强
- 新的工作流模式

## 📚 其他资源

### 文档
- [Sunra AI 文档](https://docs.sunra.ai/)
- [Python SDK 参考](https://docs.sunra.ai/client-libraries/python)
- [API 参考](https://docs.sunra.ai/model-endpoint-api/queue)

### 社区
- [GitHub 仓库](https://github.com/sunra-ai/sunra-clients)

### 学习材料
- [示例项目](https://github.com/sunra-ai/sunra-clients/tree/main/examples)

## 🔗 快速链接

- [Sunra AI 网站](https://sunra.ai)
- [获取 API 密钥](https://sunra.ai/dashboard/api-tokens)
- [状态页面](https://status.sunra.ai)

---

祝您使用 Sunra AI 编码愉快！🚀

如有问题或需要支持，请访问我们的[支持门户](https://support.sunra.ai)或加入我们的 [Discord 社区](https://discord.gg/sunra-ai)。
