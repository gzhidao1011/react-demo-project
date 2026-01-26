---
name: circuit-breaker
description: Implement circuit breaker pattern for fault tolerance including failure detection, automatic recovery, and fallback mechanisms. Use when implementing resilience patterns.
---

# Circuit Breaker

Implement circuit breaker pattern.

## Quick Checklist

When implementing circuit breaker:

- [ ] **Circuit breaker** configured
- [ ] **Failure threshold** set
- [ ] **Recovery strategy** defined
- [ ] **Fallback** implemented
- [ ] **Monitoring** configured

## Circuit Breaker Implementation

### 1. Simple Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private threshold = 5;
  private timeout = 60000;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = "open";
        this.lastFailureTime = Date.now();
      }
      throw error;
    }
  }
}
```

## Best Practices

### ✅ Good Practices

- Set appropriate thresholds
- Implement fallbacks
- Monitor circuit state
- Log circuit events
- Test failure scenarios

### ❌ Anti-Patterns

- Don't skip fallbacks
- Don't ignore monitoring
- Don't set wrong thresholds

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
