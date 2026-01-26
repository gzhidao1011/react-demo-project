---
name: canary-deployment
description: Implement canary deployment including gradual rollouts, traffic splitting, and automatic rollback. Use when implementing gradual deployments or A/B testing deployments.
---

# Canary Deployment

Implement canary deployment strategy.

## Quick Checklist

When implementing canary:

- [ ] **Canary** environment set up
- [ ] **Traffic splitting** configured
- [ ] **Metrics** monitored
- [ ] **Rollback** automated
- [ ] **Gradual rollout** planned

## Canary Setup

### 1. Traffic Splitting

```typescript
function routeRequest(request: Request): string {
  const canaryPercentage = 10; // 10% to canary
  const hash = hashRequest(request);
  
  if (hash % 100 < canaryPercentage) {
    return "canary";
  }
  return "stable";
}
```

## Best Practices

### ✅ Good Practices

- Start with small percentage
- Monitor metrics closely
- Automate rollback
- Increase gradually
- Clean up after rollout

### ❌ Anti-Patterns

- Don't skip monitoring
- Don't rush rollout
- Don't ignore errors

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
