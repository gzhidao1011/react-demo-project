---
name: run-tests
description: Run tests, check test coverage, and verify test results. Use when the user asks to run tests, check test coverage, or verify test status.
---

# Run Tests

Run tests and check coverage following project standards.

## Quick Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm --filter @repo/utils test
```

## Test Structure

Tests should follow AAA pattern:

```typescript
describe("FeatureName", () => {
  it("should do something", () => {
    // Arrange: Set up test data
    const input = "test";
    
    // Act: Execute the function
    const result = functionUnderTest(input);
    
    // Assert: Verify the result
    expect(result).toBe("expected");
  });
});
```

## Coverage Requirements

- **Overall**: Minimum 80%
- **Critical modules**: Minimum 90%
- **Utility functions**: Minimum 90%
- **Business logic**: Minimum 70%

## Test Best Practices

### ✅ Good Practices

- Tests are independent
- Tests are readable and descriptive
- Tests cover edge cases
- Tests use proper assertions
- Tests clean up after themselves

### ❌ Anti-Patterns

- Tests depend on each other
- Tests are too complex
- Tests don't test anything meaningful
- Tests have side effects
- Tests use magic numbers

## Running Tests

### Local Development

```bash
# Watch mode (recommended during development)
pnpm test:watch

# Single run
pnpm test

# With coverage
pnpm test:coverage
```

### CI/CD

Tests run automatically on:
- PR creation/update
- Push to main branch
- Manual workflow trigger

## Test Files Location

- `**/*.test.ts` - Test files
- `**/*.test.tsx` - Component test files
- `**/*.spec.ts` - Alternative test files

## Common Test Patterns

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { functionToTest } from "./module";

describe("functionToTest", () => {
  it("should handle normal case", () => {
    expect(functionToTest("input")).toBe("output");
  });
  
  it("should handle edge case", () => {
    expect(functionToTest("")).toBe("");
  });
});
```

### Component Tests

```typescript
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";

describe("Component", () => {
  it("should render correctly", () => {
    render(<Component />);
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Tests Failing

1. Check error message
2. Run tests locally: `pnpm test`
3. Check test file syntax
4. Verify dependencies installed
5. Check test environment setup

### Coverage Low

1. Identify uncovered code
2. Add tests for missing coverage
3. Remove dead code if not needed
4. Refactor to improve testability

## Related Rules

- Test Configuration: `.cursor/rules/15-测试与发布流程.mdc`
- Test Standards: `.cursor/rules/20-测试与覆盖率规范.mdc`
