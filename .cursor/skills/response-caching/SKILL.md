---
name: response-caching
description: Implement response caching including HTTP caching, cache headers, and cache invalidation. Use when caching API responses or optimizing response delivery.
---

# Response Caching

Implement response caching.

## Quick Checklist

When implementing caching:

- [ ] **Cache** strategy selected
- [ ] **Headers** configured
- [ ] **TTL** set
- [ ] **Invalidation** implemented
- [ ] **Monitoring** configured

## Response Caching

### 1. Cache Headers

```typescript
export function setCacheHeaders(response: Response, ttl: number = 3600) {
  response.headers.set("Cache-Control", `public, max-age=${ttl}`);
  response.headers.set("ETag", generateETag(response.body));
  response.headers.set("Last-Modified", new Date().toUTCString());
}
```

## Best Practices

### ✅ Good Practices

- Set cache headers
- Use ETags
- Implement invalidation
- Monitor cache hit rate
- Set appropriate TTL

### ❌ Anti-Patterns

- Don't cache sensitive data
- Don't skip invalidation
- Don't ignore headers

## Related Rules

- Caching Strategy: `.cursor/skills/caching-strategy/SKILL.md`
