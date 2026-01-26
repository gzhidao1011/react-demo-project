---
name: api-observability
description: Implement API observability including logging, metrics, tracing, and distributed tracing. Use when implementing observability or monitoring API behavior.
---

# API Observability

Implement API observability.

## Quick Checklist

When implementing observability:

- [ ] **Logging** configured
- [ ] **Metrics** collected
- [ ] **Tracing** implemented
- [ ] **Dashboards** created
- [ ] **Alerts** configured

## Observability Implementation

### 1. Structured Logging

```typescript
import { logger } from "@repo/utils";

logger.info("API request", {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  requestId: req.id,
});
```

## Best Practices

### ✅ Good Practices

- Use structured logging
- Collect metrics
- Implement tracing
- Create dashboards
- Set up alerts

### ❌ Anti-Patterns

- Don't log sensitive data
- Don't skip metrics
- Don't ignore tracing

## Related Rules

- Observability: `.cursor/skills/observability/SKILL.md`
