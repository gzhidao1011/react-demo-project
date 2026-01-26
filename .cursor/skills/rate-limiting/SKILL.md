---
name: rate-limiting
description: Implement rate limiting including API rate limits, user-based limits, and distributed rate limiting. Use when protecting APIs or preventing abuse.
---

# Rate Limiting

Implement rate limiting strategies.

## Quick Checklist

When implementing rate limiting:

- [ ] **Rate limit** strategy selected
- [ ] **Limits** configured
- [ ] **Headers** added
- [ ] **Error handling** implemented
- [ ] **Distributed** limiting (if needed)

## Rate Limiting Implementation

### 1. Token Bucket

```typescript
class RateLimiter {
  private tokens: Map<string, number> = new Map();
  private capacity: number;
  private refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const token = this.tokens.get(key) || { count: this.capacity, lastRefill: now };

    const elapsed = now - token.lastRefill;
    const newTokens = Math.floor((elapsed / 1000) * this.refillRate);
    token.count = Math.min(this.capacity, token.count + newTokens);
    token.lastRefill = now;

    if (token.count >= 1) {
      token.count--;
      this.tokens.set(key, token);
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
- Handle rate limit errors
- Use distributed limiting for scale
- Monitor rate limit usage

### ❌ Anti-Patterns

- Don't skip rate limiting
- Don't ignore headers
- Don't set too strict limits

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- API Development: `.cursor/skills/api-development/SKILL.md`
