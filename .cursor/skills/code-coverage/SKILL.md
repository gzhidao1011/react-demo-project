---
name: code-coverage
description: Track and enforce code coverage including coverage thresholds, coverage reports, and coverage analysis. Use when tracking test coverage or enforcing coverage requirements.
---

# Code Coverage

Track and enforce code coverage.

## Quick Checklist

When tracking coverage:

- [ ] **Coverage** tool configured
- [ ] **Thresholds** set
- [ ] **Reports** generated
- [ ] **CI enforcement** configured
- [ ] **Coverage** analyzed

## Coverage Configuration

### 1. Coverage Thresholds

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

## Best Practices

### ✅ Good Practices

- Set realistic thresholds
- Focus on critical paths
- Review coverage reports
- Enforce in CI
- Track trends

### ❌ Anti-Patterns

- Don't aim for 100%
- Don't ignore quality
- Don't skip analysis

## Related Rules

- Test Strategies: `.cursor/skills/test-strategies/SKILL.md`
