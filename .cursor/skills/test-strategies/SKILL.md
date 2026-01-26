---
name: test-strategies
description: Define testing strategies including unit tests, integration tests, E2E tests, and test coverage goals. Use when planning testing approach or defining test requirements.
---

# Test Strategies

Define comprehensive testing strategies.

## Quick Checklist

When defining test strategies:

- [ ] **Test types** defined (unit, integration, E2E)
- [ ] **Coverage goals** set
- [ ] **Test pyramid** established
- [ ] **Testing tools** selected
- [ ] **CI/CD integration** configured
- [ ] **Test data** management planned
- [ ] **Mocking strategy** defined

## Test Pyramid

### 1. Test Distribution

```
        /\
       /E2E\        Few E2E tests
      /------\
     /Integration\  Some integration tests
    /------------\
   /   Unit Tests  \  Many unit tests
  /----------------\
```

### 2. Test Types

**Unit Tests** (70%):
- Test individual functions/components
- Fast execution
- Isolated testing

**Integration Tests** (20%):
- Test component interactions
- Test API integrations
- Moderate speed

**E2E Tests** (10%):
- Test full user flows
- Slower execution
- Real browser testing

## Coverage Goals

### 1. Coverage Targets

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
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

## Testing Tools

### 1. Unit Testing

- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing
- **Jest** - Alternative test runner

### 2. E2E Testing

- **Playwright** - Modern E2E testing
- **Cypress** - Popular E2E framework

## Best Practices

### ✅ Good Practices

- Follow test pyramid
- Set coverage goals
- Write maintainable tests
- Use appropriate test types
- Keep tests fast
- Test user behavior, not implementation

### ❌ Anti-Patterns

- Don't write too many E2E tests
- Don't skip unit tests
- Don't test implementation details
- Don't ignore flaky tests

## Related Rules

- Test Writing: `.cursor/skills/test-writing/SKILL.md`
- Run Tests: `.cursor/skills/run-tests/SKILL.md`
