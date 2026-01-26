---
name: bulkhead-pattern
description: Implement bulkhead pattern for fault isolation including resource isolation, thread pools, and connection pools. Use when implementing fault isolation or resource management.
---

# Bulkhead Pattern

Implement bulkhead pattern for fault isolation.

## Quick Checklist

When implementing bulkhead:

- [ ] **Resources** isolated
- [ ] **Thread pools** configured
- [ ] **Connection pools** set
- [ ] **Isolation** verified
- [ ] **Monitoring** configured

## Bulkhead Implementation

### 1. Resource Isolation

```typescript
class BulkheadPool {
  private pools = new Map<string, Pool>();

  getPool(service: string): Pool {
    if (!this.pools.has(service)) {
      this.pools.set(service, new Pool({
        max: 10,
        min: 2,
      }));
    }
    return this.pools.get(service)!;
  }
}
```

## Best Practices

### ✅ Good Practices

- Isolate resources
- Set appropriate limits
- Monitor pools
- Handle failures
- Test isolation

### ❌ Anti-Patterns

- Don't share pools
- Don't skip limits
- Don't ignore monitoring

## Related Rules

- Circuit Breaker: `.cursor/skills/circuit-breaker/SKILL.md`
