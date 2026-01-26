---
name: capacity-planning
description: Plan system capacity including resource estimation, scaling strategies, and capacity monitoring. Use when planning for growth or estimating resources.
---

# Capacity Planning

Plan system capacity.

## Quick Checklist

When planning capacity:

- [ ] **Current usage** analyzed
- [ ] **Growth** projected
- [ ] **Resources** estimated
- [ ] **Scaling** strategy defined
- [ ] **Monitoring** configured

## Capacity Estimation

### 1. Resource Calculation

```typescript
interface CapacityEstimate {
  currentLoad: number;
  growthRate: number;
  targetCapacity: number;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

function estimateCapacity(
  currentLoad: number,
  growthRate: number,
  months: number
): CapacityEstimate {
  const projectedLoad = currentLoad * Math.pow(1 + growthRate, months);
  return {
    currentLoad,
    growthRate,
    targetCapacity: projectedLoad,
    resources: {
      cpu: projectedLoad * 0.1,
      memory: projectedLoad * 0.5,
      storage: projectedLoad * 2,
    },
  };
}
```

## Best Practices

### ✅ Good Practices

- Monitor current usage
- Project growth
- Plan for headroom
- Review regularly
- Automate scaling

### ❌ Anti-Patterns

- Don't ignore trends
- Don't skip planning
- Don't over-provision

## Related Rules

- Resource Optimization: `.cursor/skills/resource-optimization/SKILL.md`
