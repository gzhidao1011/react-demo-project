---
name: microservices-patterns
description: Apply microservices patterns including API Gateway, Service Discovery, Circuit Breaker, and Saga patterns. Use when building microservices or applying microservices patterns.
---

# Microservices Patterns

Apply microservices patterns.

## Quick Checklist

When applying patterns:

- [ ] **Pattern** identified
- [ ] **Pattern** appropriate
- [ ] **Implementation** follows pattern
- [ ] **Documentation** added
- [ ] **Testing** included

## Common Patterns

### 1. API Gateway Pattern

```typescript
// Central entry point
app.use("/api/users", proxy("http://user-service:8001"));
app.use("/api/orders", proxy("http://order-service:8002"));
```

### 2. Circuit Breaker Pattern

```typescript
const circuitBreaker = new CircuitBreaker(serviceCall, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
```

## Best Practices

### ✅ Good Practices

- Use appropriate patterns
- Document pattern usage
- Test implementations
- Monitor patterns
- Refactor when needed

### ❌ Anti-Patterns

- Don't force patterns
- Don't over-complicate
- Don't skip monitoring

## Related Rules

- Service Integration: `.cursor/skills/service-integration/SKILL.md`
