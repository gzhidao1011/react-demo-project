---
name: blue-green-deployment
description: Implement blue-green deployment including zero-downtime deployments, traffic switching, and rollback procedures. Use when implementing zero-downtime deployments.
---

# Blue-Green Deployment

Implement blue-green deployment strategy.

## Quick Checklist

When implementing blue-green:

- [ ] **Two environments** set up
- [ ] **Traffic switching** configured
- [ ] **Health checks** implemented
- [ ] **Rollback** procedure defined
- [ ] **Monitoring** configured

## Blue-Green Setup

### 1. Traffic Switching

```nginx
# Switch traffic from blue to green
upstream backend {
  server green:8080;
  # server blue:8080 backup;
}
```

## Best Practices

### ✅ Good Practices

- Test green environment
- Switch traffic gradually
- Monitor both environments
- Keep rollback ready
- Clean up old environment

### ❌ Anti-Patterns

- Don't skip testing
- Don't switch all at once
- Don't ignore monitoring

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
