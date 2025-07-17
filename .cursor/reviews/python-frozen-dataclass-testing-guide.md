# Python Frozen Dataclass Testing Quick Reference

**🚨 TL;DR**: When testing frozen dataclasses, ALWAYS use class-level patching, never instance-level patching.

## ⚡ Quick Solutions

### ✅ **Correct Pattern**
```python
# Class-level patching (patches the method on the class)
with patch('module.MyClass.method_name', return_value="result") as mock:
    instance = MyClass()
    result = instance.method_name()
    assert mock.call_count == 1
```

### ❌ **Wrong Pattern** 
```python
# Instance-level patching (will fail with FrozenInstanceError)
instance = MyClass()
with patch.object(instance, 'method_name') as mock:  # 💥 FrozenInstanceError
    result = instance.method_name()
```

## 🔧 Common Patterns

### **Sync Method Testing**
```python
with patch('sunra_client.client.SyncClient.upload', return_value="https://cdn.example.com/uploaded") as mock:
    client = SyncClient()
    result = client.upload(data, content_type)
    assert result == "https://cdn.example.com/uploaded"
    assert mock.call_count == 1
```

### **Async Method Testing**
```python
with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded") as mock:
    client = AsyncClient()
    result = await client.upload(data, content_type)
    assert result == "https://cdn.example.com/uploaded"
    assert mock.call_count == 1
```

## 🎯 Key Rules

1. **Use `patch('module.Class.method')`** not `patch.object(instance, 'method')`
2. **Use `new_callable=AsyncMock`** for async methods
3. **Use `call_count`** assertions instead of parameter checking
4. **Patch before creating instances** when possible

## 🚨 Warning Signs

If you see this error:
```
dataclasses.FrozenInstanceError: cannot assign to field 'method_name'
dataclasses.FrozenInstanceError: cannot delete field 'method_name'
```

**Solution**: Switch from `patch.object()` to `patch()` with full module path.

## 📋 Checklist

- [ ] Are you testing a frozen dataclass? (`@dataclass(frozen=True)`)
- [ ] Using class-level patching? (`patch('module.Class.method')`)
- [ ] Using `AsyncMock` for async methods? (`new_callable=AsyncMock`)
- [ ] Using simple assertions? (`assert mock.call_count == 1`)

## 🔗 Full Review

See `python-transform-input-testing-review.md` for complete analysis and lessons learned. 
