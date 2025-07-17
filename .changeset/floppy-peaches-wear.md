---
"@sunra/python-client": minor
---

Add automatic input transformation functionality to Python SDK

The Python client now automatically transforms various input types when calling `submit()` or `subscribe()` methods:

- **PIL Image objects**: Automatically uploaded and replaced with URLs
- **Base64 data URIs**: Decoded and uploaded with proper content type detection  
- **File paths**: Local files uploaded to CDN and replaced with URLs
- **File-like objects**: Objects with `read()` method (e.g., BytesIO, file handles) uploaded automatically
- **Recursive processing**: Works on nested dictionaries and lists

This feature eliminates the need for manual file uploads and streamlines the developer experience when working with multimedia inputs. The transformation is performed automatically in both sync and async clients, with comprehensive error handling and support for various file formats.

New methods added:
- `transform_input()` - Available on both `AsyncClient` and `SyncClient` for manual transformation
- Automatic integration with existing `submit()` and `subscribe()` methods

The feature includes extensive test coverage and documentation with practical examples.
