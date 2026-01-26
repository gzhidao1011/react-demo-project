---
name: caching-patterns
description: Implement caching patterns including cache-aside, write-through, write-behind, and cache invalidation strategies. Use when implementing caching or optimizing data access.
---

# Caching Patterns

Implement advanced caching patterns.

## Quick Checklist

When implementing caching:

- [ ] **Cache pattern** selected
- [ ] **Cache strategy** implemented
- [ ] **Invalidation** strategy defined
- [ ] **Cache warming** configured (if needed)
- [ ] **Monitoring** set up

## Cache Patterns

### 1. Cache-Aside

```typescript
async function getData(key: string) {
  let data = await cache.get(key);
  if (!data) {
    data = await database.get(key);
    await cache.set(key, data);
  }
  return data;
}
```

### 2. Write-Through

```typescript
async function updateData(key: string, value: unknown) {
  await database.set(key, value);
  await cache.set(key, value);
}
```

### 3. Write-Behind

```typescript
async function updateData(key: string, value: unknown) {
  await cache.set(key, value);
  queue.push({ key, value });
  // Async write to database
}
```

## Best Practices

### ✅ Good Practices

- Choose appropriate pattern
- Implement invalidation
- Monitor cache hit rate
- Handle cache failures
- Set TTL appropriately

### ❌ Anti-Patterns

- Don't cache everything
- Don't skip invalidation
- Don't ignore cache failures

## Related Rules

- Caching Strategy: `.cursor/skills/caching-strategy/SKILL.md`
