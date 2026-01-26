---
name: performance-budget
description: Define and enforce performance budgets including bundle size limits, load time targets, and Web Vitals thresholds. Use when setting performance targets or enforcing performance constraints.
---

# Performance Budget

Define and enforce performance budgets.

## Quick Checklist

When setting budgets:

- [ ] **Budgets** defined
- [ ] **Thresholds** set
- [ ] **Monitoring** configured
- [ ] **CI enforcement** set up
- [ ] **Reports** generated

## Performance Budget

### 1. Budget Configuration

```json
{
  "budgets": [
    {
      "path": "/",
      "timings": [
        { "metric": "first-contentful-paint", "budget": 2000 },
        { "metric": "largest-contentful-paint", "budget": 3000 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 200 }
      ]
    }
  ]
}
```

## Best Practices

### ✅ Good Practices

- Set realistic budgets
- Monitor continuously
- Enforce in CI
- Review regularly
- Document rationale

### ❌ Anti-Patterns

- Don't set unrealistic budgets
- Don't ignore violations
- Don't skip enforcement

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
