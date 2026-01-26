---
name: api-rate-limiting
description: Implement API rate limiting including per-user limits, per-IP limits, and tiered limits. Use when implementing rate limiting or protecting APIs.
---

# API Rate Limiting

Implement API rate limiting.

## Quick Checklist

When implementing rate limiting:

- [ ] **Limits** defined
- [ ] **Strategy** selected
- [ ] **Headers** added
- [ ] **Error** handling implemented
- [ ] **Monitoring** configured

## Rate Limiting Implementation

### 1. Token Bucket

```typescript
class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  
  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    const bucket = this.buckets.get(key) || { tokens: limit, lastRefill: Date.now() };
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const refill = Math.floor((elapsed / window) * limit);
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.lastRefill = now;
    
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      this.buckets.set(key, bucket);
      return true;
    }
    return false;
  }
}
```

## Best Practices

### ✅ Good Practices

- Set appropriate limits
- Add rate limit headers
- Handle errors gracefully
- Monitor usage
- Adjust dynamically

### ❌ Anti-Patterns

- Don't skip rate limiting
- Don't ignore headers
- Don't set too strict

## Related Rules

- Rate Limiting: `.cursor/skills/rate-limiting/SKILL.md`
