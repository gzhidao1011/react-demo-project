---
name: api-monitoring
description: Monitor APIs including metrics collection, error tracking, and performance monitoring. Use when monitoring APIs or tracking API health.
---

# API Monitoring

Monitor APIs comprehensively.

## Quick Checklist

When monitoring APIs:

- [ ] **Metrics** collected
- [ ] **Errors** tracked
- [ ] **Performance** monitored
- [ ] **Dashboards** created
- [ ] **Alerts** configured

## API Monitoring

### 1. Metrics Collection

```typescript
import { Counter, Histogram } from "prom-client";

const apiRequests = new Counter({
  name: "api_requests_total",
  help: "Total API requests",
  labelNames: ["method", "endpoint", "status"],
});

const apiDuration = new Histogram({
  name: "api_request_duration_seconds",
  help: "API request duration",
  labelNames: ["method", "endpoint"],
});
```

## Best Practices

### ✅ Good Practices

- Collect relevant metrics
- Track errors
- Monitor performance
- Create dashboards
- Set up alerts

### ❌ Anti-Patterns

- Don't collect too many
- Don't skip error tracking
- Don't ignore performance

## Related Rules

- Performance Monitoring: `.cursor/skills/performance-monitoring/SKILL.md`
