---
name: distributed-tracing
description: Implement distributed tracing including trace collection, span management, and trace analysis. Use when implementing distributed tracing or debugging microservices.
---

# Distributed Tracing

Implement distributed tracing.

## Quick Checklist

When implementing tracing:

- [ ] **Tracing system** selected
- [ ] **Spans** created
- [ ] **Trace context** propagated
- [ ] **Trace collection** configured
- [ ] **Analysis** tools set up

## Tracing Implementation

### 1. OpenTelemetry Setup

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-service");

export function tracedFunction(name: string, fn: () => Promise<unknown>) {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Best Practices

### ✅ Good Practices

- Trace critical paths
- Propagate trace context
- Add meaningful spans
- Record exceptions
- Analyze traces regularly

### ❌ Anti-Patterns

- Don't trace everything
- Don't skip context propagation
- Don't ignore trace data

## Related Rules

- Observability: `.cursor/skills/observability/SKILL.md`
