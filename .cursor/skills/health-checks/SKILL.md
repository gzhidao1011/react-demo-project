---
name: health-checks
description: Implement health checks including liveness probes, readiness probes, and dependency health checks. Use when implementing health monitoring or Kubernetes probes.
---

# Health Checks

Implement health check endpoints.

## Quick Checklist

When implementing health checks:

- [ ] **Health endpoint** created
- [ ] **Liveness probe** implemented
- [ ] **Readiness probe** implemented
- [ ] **Dependency checks** added
- [ ] **Metrics** exposed

## Health Check Implementation

### 1. Health Endpoint

```typescript
// apps/web/app/routes/health.ts
export async function loader() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    api: await checkAPI(),
  };

  const healthy = Object.values(checks).every((v) => v === true);

  return json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
```

## Best Practices

### ✅ Good Practices

- Implement liveness probe
- Implement readiness probe
- Check dependencies
- Return appropriate status codes
- Include timestamps

### ❌ Anti-Patterns

- Don't skip health checks
- Don't check external services in liveness
- Don't ignore dependency failures

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
