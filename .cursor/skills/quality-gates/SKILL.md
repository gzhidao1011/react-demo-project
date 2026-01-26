---
name: quality-gates
description: Define and enforce quality gates including code coverage thresholds, performance budgets, and quality metrics. Use when setting quality standards or enforcing quality checks.
---

# Quality Gates

Define and enforce quality gates.

## Quick Checklist

When setting quality gates:

- [ ] **Coverage thresholds** defined
- [ ] **Performance budgets** set
- [ ] **Code quality** metrics defined
- [ ] **Quality gates** enforced in CI
- [ ] **Quality reports** generated
- [ ] **Thresholds** reviewed regularly

## Coverage Thresholds

### 1. Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

## Performance Budgets

### 1. Performance Budget

```json
// .lighthouseci/performance-budget.json
{
  "budgets": [
    {
      "path": "/",
      "timings": [
        {
          "metric": "first-contentful-paint",
          "budget": 2000
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 3000
        }
      ],
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 200
        }
      ]
    }
  ]
}
```

## Code Quality Metrics

### 1. Quality Configuration

```json
// .eslintrc.json
{
  "rules": {
    "complexity": ["error", 10],
    "max-lines": ["warn", 300],
    "max-lines-per-function": ["warn", 50]
  }
}
```

## Best Practices

### ✅ Good Practices

- Set realistic thresholds
- Enforce in CI/CD
- Review regularly
- Document standards
- Provide feedback
- Track trends

### ❌ Anti-Patterns

- Don't set unrealistic thresholds
- Don't ignore quality gates
- Don't skip enforcement
- Don't forget to review

## Related Rules

- Test Strategies: `.cursor/skills/test-strategies/SKILL.md`
- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
