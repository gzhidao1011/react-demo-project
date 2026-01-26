---
name: contract-testing
description: Implement contract testing including consumer contracts, provider contracts, and contract validation. Use when testing API contracts or ensuring API compatibility.
---

# Contract Testing

Implement contract testing.

## Quick Checklist

When contract testing:

- [ ] **Contracts** defined
- [ ] **Consumer** tests written
- [ ] **Provider** tests written
- [ ] **Validation** automated
- [ ] **Breaking** changes detected

## Contract Testing

### 1. Pact Testing

```typescript
import { Pact } from "@pact-foundation/pact";

const provider = new Pact({
  consumer: "Frontend",
  provider: "UserService",
});

describe("User API Contract", () => {
  it("should match contract", async () => {
    await provider.addInteraction({
      state: "user exists",
      uponReceiving: "a request for user",
      withRequest: {
        method: "GET",
        path: "/api/users/1",
      },
      willRespondWith: {
        status: 200,
        body: {
          id: "1",
          name: "User 1",
        },
      },
    });
  });
});
```

## Best Practices

### ✅ Good Practices

- Define contracts
- Test both sides
- Automate validation
- Detect breaking changes
- Version contracts

### ❌ Anti-Patterns

- Don't skip contracts
- Don't ignore breaking changes
- Don't skip versioning

## Related Rules

- API Testing: `.cursor/skills/api-testing/SKILL.md`
