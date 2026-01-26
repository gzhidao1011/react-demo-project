---
name: request-validation
description: Implement request validation including schema validation, input sanitization, and validation error handling. Use when validating requests or implementing input validation.
---

# Request Validation

Implement request validation.

## Quick Checklist

When implementing validation:

- [ ] **Schema** defined
- [ ] **Validation** implemented
- [ ] **Sanitization** applied
- [ ] **Error** messages provided
- [ ] **Client/server** validation

## Validation Implementation

### 1. Schema Validation

```typescript
import { z } from "zod";

const requestSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
});

export function validateRequest(data: unknown) {
  return requestSchema.parse(data);
}
```

## Best Practices

### ✅ Good Practices

- Validate early
- Use schemas
- Sanitize input
- Provide clear errors
- Validate on both sides

### ❌ Anti-Patterns

- Don't trust client only
- Don't skip sanitization
- Don't ignore errors

## Related Rules

- Data Validation: `.cursor/skills/data-validation/SKILL.md`
