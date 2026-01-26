---
name: api-performance
description: Optimize API performance including response time, throughput, and latency optimization. Use when optimizing API performance or improving response times.
---

# API Performance

Optimize API performance.

## Quick Checklist

When optimizing performance:

- [ ] **Performance** measured
- [ ] **Bottlenecks** identified
- [ ] **Optimization** applied
- [ ] **Caching** implemented
- [ ] **Monitoring** configured

## Performance Optimization

### 1. Query Optimization

```typescript
// Use indexes
await db.query("CREATE INDEX idx_user_email ON users(email)");

// Use select specific fields
await db.select("id", "name").from("users");

// Use pagination
await db.select().from("users").limit(20).offset(0);
```

## Best Practices

### ✅ Good Practices

- Measure performance
- Identify bottlenecks
- Optimize queries
- Use caching
- Monitor continuously

### ❌ Anti-Patterns

- Don't skip measurement
- Don't ignore bottlenecks
- Don't skip optimization

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
