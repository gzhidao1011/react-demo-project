---
name: throttling
description: Implement throttling including request throttling, user throttling, and adaptive throttling. Use when implementing throttling or rate control.
---

# Throttling

Implement throttling strategies.

## Quick Checklist

When implementing throttling:

- [ ] **Throttling** strategy selected
- [ ] **Limits** configured
- [ ] **Headers** added
- [ ] **Error** handling implemented
- [ ] **Monitoring** configured

## Throttling Implementation

### 1. Token Bucket

```typescript
class Throttler {
  private tokens: Map<string, number> = new Map();
  private capacity: number;
  private refillRate: number;

  async throttle(key: string): Promise<boolean> {
    const token = this.tokens.get(key) || this.capacity;
    if (token > 0) {
      this.tokens.set(key, token - 1);
      return true;
    }
    return false;
  }
}
```

## Best Practices

### ✅ Good Practices

- Set appropriate limits
- Add throttle headers
- Handle throttle errors
- Monitor usage
- Adjust dynamically

### ❌ Anti-Patterns

- Don't skip throttling
- Don't ignore headers
- Don't set too strict

## Related Rules

- Rate Limiting: `.cursor/skills/rate-limiting/SKILL.md`
