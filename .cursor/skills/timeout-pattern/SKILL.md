---
name: timeout-pattern
description: Implement timeout patterns including request timeouts, connection timeouts, and timeout handling. Use when implementing timeouts or handling slow operations.
---

# Timeout Pattern

Implement timeout patterns.

## Quick Checklist

When implementing timeouts:

- [ ] **Timeout** values set
- [ ] **Timeout** handling implemented
- [ ] **Retry** logic configured
- [ ] **Error** handling added
- [ ] **Monitoring** configured

## Timeout Implementation

### 1. Request Timeout

```typescript
async function requestWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Best Practices

### ✅ Good Practices

- Set appropriate timeouts
- Handle timeout errors
- Implement retries
- Monitor timeouts
- Document timeouts

### ❌ Anti-Patterns

- Don't skip timeouts
- Don't ignore errors
- Don't set too long

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
