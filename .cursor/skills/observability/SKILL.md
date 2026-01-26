---
name: observability
description: Implement observability including logging, metrics, tracing, and monitoring. Use when setting up observability or monitoring systems.
---

# Observability

Implement comprehensive observability.

## Quick Checklist

When implementing observability:

- [ ] **Logging** configured
- [ ] **Metrics** collected
- [ ] **Tracing** implemented
- [ ] **Dashboards** created
- [ ] **Alerts** configured

## Observability Stack

### 1. Logging

```typescript
import { logger } from "@repo/utils";

logger.info("User action", { userId: "123", action: "login" });
```

### 2. Metrics

```typescript
import { metrics } from "@repo/utils";

metrics.increment("api.requests", { endpoint: "/users" });
metrics.timing("api.response_time", duration, { endpoint: "/users" });
```

### 3. Tracing

```typescript
import { tracer } from "@repo/utils";

const span = tracer.startSpan("user.fetch");
try {
  const user = await fetchUser(id);
  span.setTag("user.id", id);
  return user;
} finally {
  span.finish();
}
```

## Best Practices

### ✅ Good Practices

- Log structured data
- Collect relevant metrics
- Trace critical paths
- Set up dashboards
- Configure alerts

### ❌ Anti-Patterns

- Don't log sensitive data
- Don't collect too many metrics
- Don't skip tracing
- Don't ignore alerts

## Related Rules

- Logging Management: `.cursor/skills/logging-management/SKILL.md`
- Performance Monitoring: `.cursor/skills/performance-monitoring/SKILL.md`
