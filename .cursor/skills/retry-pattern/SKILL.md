---
name: retry-pattern
description: Implement retry patterns including exponential backoff, jitter, and retry policies. Use when implementing retries or handling transient failures.
---

# Retry Pattern

Implement retry patterns.

## Quick Checklist

When implementing retries:

- [ ] **Retry** strategy selected
- [ ] **Backoff** configured
- [ ] **Max retries** set
- [ ] **Error** handling added
- [ ] **Monitoring** configured

## Retry Implementation

### 1. Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Best Practices

### ✅ Good Practices

- Use exponential backoff
- Add jitter
- Set max retries
- Handle non-retryable errors
- Monitor retries

### ❌ Anti-Patterns

- Don't retry forever
- Don't skip backoff
- Don't retry non-retryable errors

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
