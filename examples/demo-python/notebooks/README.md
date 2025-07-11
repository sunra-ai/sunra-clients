# Sunra AI Python SDK - Jupyter Notebooks

Welcome to the Sunra AI Python SDK Jupyter Notebooks! This collection of interactive notebooks will guide you through all aspects of using the Sunra AI platform for your AI projects.

## 📚 Notebooks Overview

### 01-getting-started.ipynb
**Your First Steps with Sunra AI**
- Installation and setup
- API key configuration
- Basic usage examples
- Environment setup
- First image generation
- Troubleshooting guide

### 02-text-to-image.ipynb
**Master Text-to-Image Generation**
- Advanced prompt engineering
- Understanding parameters (seeds, aspect ratios, etc.)
- Prompt enhancement techniques
- Batch generation
- Style variations
- Performance optimization

### 03-image-to-image-and-video.ipynb
**Transform Images and Create Videos**
- Image-to-image transformations
- Image-to-video generation
- Working with input images
- Understanding strength parameters
- Video generation options
- URL management for assets

### 04-speech-to-text.ipynb
**Convert Audio to Text**
- Speech-to-text transcription
- Language support and detection
- Speaker diarization
- Audio event tagging
- Working with different audio formats
- Advanced transcription formatting

### 05-advanced-configuration.ipynb
**Professional Configuration Management**
- Multiple API key management
- Environment-specific configurations
- Error handling and retry strategies
- Performance monitoring
- Custom callback functions
- Production-ready setups

### 06-complete-workflows.ipynb
**End-to-End AI Workflows**
- Multi-modal AI pipelines
- Content creation workflows
- Automated processing chains
- Real-world use cases
- Performance optimization
- Error handling in complex workflows

## 🚀 Getting Started

### Prerequisites
- Python 3.7 or higher
- Jupyter Notebook or JupyterLab
- A Sunra AI account and API key

### Installation

1. **Install Jupyter**:
   ```bash
   pip install jupyter
   ```

2. **Install Required Packages**:
   ```bash
   pip install sunra-client requests pillow matplotlib
   ```

3. **Get Your API Key**:
   - Sign up at [sunra.ai](https://sunra.ai)
   - Get your API key from the [dashboard](https://sunra.ai/dashboard/keys)

4. **Set Up Environment Variable**:
   ```bash
   export SUNRA_KEY=your-api-key-here
   ```

### Running the Notebooks

1. **Start Jupyter**:
   ```bash
   jupyter notebook
   ```

2. **Open the notebooks** in order, starting with `01-getting-started.ipynb`

3. **Follow along** with the interactive examples

## 📖 Learning Path

### Beginner Path
1. **01-getting-started.ipynb** - Essential setup and first steps
2. **02-text-to-image.ipynb** - Learn basic image generation
3. **04-speech-to-text.ipynb** - Try audio processing

### Intermediate Path
1. Complete the Beginner Path
2. **03-image-to-image-and-video.ipynb** - Work with visual transformations
3. **05-advanced-configuration.ipynb** - Professional configurations

### Advanced Path
1. Complete all previous notebooks
2. **06-complete-workflows.ipynb** - Build complex AI pipelines
3. Experiment with your own use cases

## 🎯 Use Cases by Notebook

### Content Creation
- **Text-to-Image**: Generate marketing visuals, concept art, social media content
- **Image-to-Video**: Create animated content, product demonstrations
- **Speech-to-Text**: Transcribe podcasts, meetings, interviews

### Business Applications
- **Automated Workflows**: Content pipelines, social media automation
- **Multi-modal Processing**: Combine text, image, and audio processing
- **Professional Tools**: Meeting transcription, content generation

### Creative Projects
- **Art Generation**: Digital art, concept designs, style exploration
- **Content Transformation**: Style transfers, format conversions
- **Interactive Media**: Dynamic content generation

## 🛠️ Technical Requirements

### System Requirements
- **Memory**: 4GB+ RAM recommended
- **Storage**: 1GB+ free space
- **Network**: Stable internet connection for API calls

### Python Dependencies
```txt
sunra-client>=1.0.0
requests>=2.25.0
pillow>=8.0.0
matplotlib>=3.3.0
jupyter>=1.0.0
```

### Optional Dependencies
```txt
numpy>=1.19.0
pandas>=1.2.0
seaborn>=0.11.0
```

## 📝 Configuration Options

### Environment Variables
```bash
# Required
export SUNRA_KEY=your-api-key-here

# Optional - for advanced configurations
export SUNRA_KEY_DEV=your-dev-api-key
export SUNRA_KEY_STAGING=your-staging-api-key
export SUNRA_KEY_PROD=your-prod-api-key
export ENVIRONMENT=development
```

### Jupyter Configuration
Create a `jupyter_config.py` file:
```python
# Allow connections from all IPs (for remote access)
c.NotebookApp.ip = '0.0.0.0'

# Set a password for security
c.NotebookApp.password = 'your-hashed-password'

# Enable auto-save
c.FileContentsManager.save_script = True
```

## 🔧 Troubleshooting

### Common Issues

**API Key Not Found**
```
Error: SUNRA_KEY environment variable not set
```
**Solution**: Set your API key as an environment variable or enter it when prompted.

**Import Errors**
```
ModuleNotFoundError: No module named 'sunra_client'
```
**Solution**: Install the required packages: `pip install sunra-client`

**Network Timeouts**
```
Connection timeout error
```
**Solution**: Check your internet connection and try again. Some operations may take longer.

**Image Display Issues**
```
Error displaying image
```
**Solution**: Check that the image URL is accessible and try refreshing the cell.

### Performance Tips

1. **Batch Processing**: Use the batch functions for multiple requests
2. **Error Handling**: Implement retry logic for production use
3. **Resource Management**: Close notebooks when not in use
4. **Caching**: Save results locally to avoid re-processing

## 📊 Monitoring and Analytics

### Built-in Monitoring
- Request tracking in advanced notebooks
- Performance metrics and timing
- Error rate monitoring
- Usage statistics

### Custom Monitoring
```python
# Example monitoring setup
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

## 🤝 Contributing

We welcome contributions to improve these notebooks!

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Test thoroughly
5. Submit a pull request

### Areas for Contribution
- Additional use case examples
- Performance optimizations
- Error handling improvements
- Documentation enhancements
- New workflow patterns

## 📚 Additional Resources

### Documentation
- [Sunra AI Documentation](https://docs.sunra.ai/)
- [Python SDK Reference](https://docs.sunra.ai/client-libraries/python)
- [API Reference](https://docs.sunra.ai/model-endpoint-api/queue)

### Community
- [GitHub Repository](https://github.com/sunra-ai/sunra-clients)

### Learning Materials
- [Example Projects](https://github.com/sunra-ai/sunra-clients/tree/main/examples)

## 🔗 Quick Links

- [Sunra AI Website](https://sunra.ai)
- [Get API Key](https://sunra.ai/dashboard/api-tokens)
- [Status Page](https://status.sunra.ai)

---

Happy coding with Sunra AI! 🚀

For questions or support, please visit our [support portal](https://support.sunra.ai) or join our [Discord community](https://discord.gg/sunra-ai). 
