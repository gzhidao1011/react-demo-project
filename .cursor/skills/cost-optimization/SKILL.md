---
name: cost-optimization
description: Optimize cloud costs including resource right-sizing, reserved instances, and cost monitoring. Use when optimizing cloud spending or managing infrastructure costs.
---

# Cost Optimization

Optimize cloud and infrastructure costs.

## Quick Checklist

When optimizing costs:

- [ ] **Cost analysis** performed
- [ ] **Resources** right-sized
- [ ] **Unused resources** identified
- [ ] **Reserved instances** considered
- [ ] **Monitoring** configured

## Cost Monitoring

### 1. Resource Tracking

```typescript
interface ResourceCost {
  resource: string;
  cost: number;
  usage: number;
}

export function analyzeCosts(resources: ResourceCost[]) {
  return resources
    .sort((a, b) => b.cost - a.cost)
    .filter((r) => r.usage < 0.1); // Low usage
}
```

## Best Practices

### ✅ Good Practices

- Monitor costs regularly
- Right-size resources
- Remove unused resources
- Use reserved instances
- Optimize storage

### ❌ Anti-Patterns

- Don't ignore costs
- Don't over-provision
- Don't skip monitoring

## Related Rules

- Resource Optimization: `.cursor/skills/resource-optimization/SKILL.md`
