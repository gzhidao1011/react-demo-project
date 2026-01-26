---
name: resource-optimization
description: Optimize resource usage including memory management, CPU optimization, and resource pooling. Use when optimizing resource consumption or improving efficiency.
---

# Resource Optimization

Optimize resource usage and efficiency.

## Quick Checklist

When optimizing resources:

- [ ] **Memory usage** analyzed
- [ ] **CPU usage** optimized
- [ ] **Connection pooling** configured
- [ ] **Caching** implemented
- [ ] **Resource limits** set

## Connection Pooling

### 1. Database Connection Pool

```typescript
import { Pool } from "pg";

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Memory Management

### 1. Memory Optimization

```typescript
// Use WeakMap for cache
const cache = new WeakMap();

// Clean up large objects
function cleanup() {
  // Remove references
  largeObject = null;
  global.gc && global.gc();
}
```

## Best Practices

### ✅ Good Practices

- Monitor resource usage
- Use connection pooling
- Implement caching
- Set resource limits
- Clean up resources

### ❌ Anti-Patterns

- Don't create too many connections
- Don't ignore memory leaks
- Don't skip resource cleanup

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
