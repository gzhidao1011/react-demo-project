---
name: api-caching
description: Implement API caching including response caching, cache invalidation, and cache strategies. Use when caching API responses or optimizing API performance.
---

# API Caching

Implement API caching.

## Quick Checklist

When implementing caching:

- [ ] **Cache** strategy selected
- [ ] **TTL** configured
- [ ] **Invalidation** implemented
- [ ] **Headers** set correctly
- [ ] **Monitoring** configured

## API Caching Implementation

### 1. Response Caching

```typescript
async function getCachedResponse(key: string, ttl: number) {
  const cached = await cache.get(key);
  if (cached) return cached;
  
  const data = await fetchData();
  await cache.set(key, data, ttl);
  return data;
}
```

## Best Practices

### ✅ Good Practices

- Cache appropriately
- Set TTL
- Implement invalidation
- Use cache headers
- Monitor hit rate

### ❌ Anti-Patterns

- Don't cache sensitive data
- Don't skip invalidation
- Don't ignore headers

## Related Rules

- Caching Strategy: `.cursor/skills/caching-strategy/SKILL.md`
