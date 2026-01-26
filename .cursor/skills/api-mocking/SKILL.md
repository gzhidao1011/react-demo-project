---
name: api-mocking
description: Mock APIs including mock servers, response mocking, and contract mocking. Use when mocking APIs for testing or development.
---

# API Mocking

Mock APIs for testing and development.

## Quick Checklist

When mocking APIs:

- [ ] **Mock** server configured
- [ ] **Responses** defined
- [ ] **Contracts** validated
- [ ] **Scenarios** covered
- [ ] **Documentation** provided

## Mock Server Setup

### 1. MSW Setup

```typescript
import { setupServer } from "msw/node";
import { rest } from "msw";

const server = setupServer(
  rest.get("/api/users", (req, res, ctx) => {
    return res(
      ctx.json([
        { id: "1", name: "User 1" },
        { id: "2", name: "User 2" },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Best Practices

### ✅ Good Practices

- Mock external APIs
- Use realistic data
- Validate contracts
- Cover scenarios
- Document mocks

### ❌ Anti-Patterns

- Don't mock internal APIs
- Don't use unrealistic data
- Don't skip validation

## Related Rules

- API Testing: `.cursor/skills/api-testing/SKILL.md`
