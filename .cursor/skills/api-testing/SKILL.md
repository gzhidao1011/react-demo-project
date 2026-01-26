---
name: api-testing
description: Test APIs including unit tests, integration tests, contract tests, and E2E tests. Use when testing APIs or implementing API test suites.
---

# API Testing

Test APIs comprehensively.

## Quick Checklist

When testing APIs:

- [ ] **Unit tests** written
- [ ] **Integration tests** created
- [ ] **Contract tests** implemented
- [ ] **E2E tests** added
- [ ] **Test** coverage tracked

## API Test Implementation

### 1. Integration Test

```typescript
describe("User API", () => {
  it("should create user", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ name: "Test", email: "test@example.com" })
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test");
  });
});
```

## Best Practices

### ✅ Good Practices

- Test all endpoints
- Test error cases
- Use test fixtures
- Mock external services
- Track coverage

### ❌ Anti-Patterns

- Don't skip error tests
- Don't test implementation
- Don't ignore coverage

## Related Rules

- Test Writing: `.cursor/skills/test-writing/SKILL.md`
