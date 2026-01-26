---
name: request-deduplication
description: Implement request deduplication including idempotency keys, request caching, and duplicate detection. Use when preventing duplicate requests or ensuring idempotency.
---

# Request Deduplication

Implement request deduplication.

## Quick Checklist

When implementing deduplication:

- [ ] **Idempotency** keys used
- [ ] **Deduplication** logic implemented
- [ ] **Cache** configured
- [ ] **TTL** set
- [ ] **Error** handling added

## Deduplication Implementation

### 1. Idempotency Key

```typescript
class IdempotencyService {
  async executeWithIdempotency<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await cache.get(`idempotency:${key}`);
    if (cached) {
      return cached;
    }

    const result = await fn();
    await cache.set(`idempotency:${key}`, result, ttl);
    return result;
  }
}
```

## Best Practices

### ✅ Good Practices

- Use idempotency keys
- Cache responses
- Set TTL
- Handle errors
- Monitor deduplication

### ❌ Anti-Patterns

- Don't skip keys
- Don't cache forever
- Don't ignore errors

## Related Rules

- Caching Strategy: `.cursor/skills/caching-strategy/SKILL.md`
