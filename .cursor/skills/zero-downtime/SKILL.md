---
name: zero-downtime
description: Achieve zero-downtime deployments including rolling updates, health checks, and traffic management. Use when implementing zero-downtime deployments or minimizing downtime.
---

# Zero-Downtime Deployment

Achieve zero-downtime deployments.

## Quick Checklist

When implementing zero-downtime:

- [ ] **Rolling updates** configured
- [ ] **Health checks** implemented
- [ ] **Traffic** management set
- [ ] **Rollback** ready
- [ ] **Monitoring** active

## Zero-Downtime Strategy

### 1. Rolling Update

```yaml
# Kubernetes deployment
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

## Best Practices

### ✅ Good Practices

- Use rolling updates
- Check health before traffic
- Keep rollback ready
- Monitor during deploy
- Test procedures

### ❌ Anti-Patterns

- Don't skip health checks
- Don't ignore monitoring
- Don't skip rollback plan

## Related Rules

- Blue-Green Deployment: `.cursor/skills/blue-green-deployment/SKILL.md`
