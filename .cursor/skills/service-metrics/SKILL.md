---
name: service-metrics
description: Collect and expose service metrics including business metrics, technical metrics, and custom metrics. Use when implementing metrics or monitoring services.
---

# Service Metrics

Collect and expose service metrics.

## Quick Checklist

When implementing metrics:

- [ ] **Metrics** defined
- [ ] **Collection** implemented
- [ ] **Exposure** configured
- [ ] **Dashboards** created
- [ ] **Alerts** configured

## Metrics Implementation

### 1. Prometheus Metrics

```typescript
import { Counter, Histogram } from "prom-client";

const httpRequests = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "status"],
});

const requestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method"],
});
```

## Best Practices

### ✅ Good Practices

- Collect relevant metrics
- Use consistent naming
- Expose metrics endpoint
- Create dashboards
- Set up alerts

### ❌ Anti-Patterns

- Don't collect too many
- Don't use inconsistent names
- Don't skip exposure

## Related Rules

- Observability: `.cursor/skills/observability/SKILL.md`
