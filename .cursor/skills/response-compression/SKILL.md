---
name: response-compression
description: Implement response compression including gzip, brotli, and content negotiation. Use when optimizing response size or reducing bandwidth.
---

# Response Compression

Implement response compression.

## Quick Checklist

When implementing compression:

- [ ] **Compression** algorithm selected
- [ ] **Middleware** configured
- [ ] **Content** negotiation set
- [ ] **Monitoring** configured
- [ ] **Performance** verified

## Compression Implementation

### 1. Compression Middleware

```typescript
import compression from "compression";

app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));
```

## Best Practices

### ✅ Good Practices

- Use compression
- Negotiate content
- Monitor performance
- Test compression
- Set appropriate level

### ❌ Anti-Patterns

- Don't skip compression
- Don't compress already compressed
- Don't ignore performance

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
