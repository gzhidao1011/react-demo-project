---
name: data-validation
description: Implement data validation including input validation, schema validation, and sanitization. Use when validating user input or API data.
---

# Data Validation

Implement comprehensive data validation.

## Quick Checklist

When implementing validation:

- [ ] **Validation** schema defined
- [ ] **Input validation** implemented
- [ ] **Sanitization** applied
- [ ] **Error messages** provided
- [ ] **Client/server** validation

## Zod Validation

### 1. Schema Definition

```typescript
import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
});

export type User = z.infer<typeof userSchema>;
```

### 2. Validation Function

```typescript
export function validateUser(data: unknown): User {
  return userSchema.parse(data);
}
```

## Best Practices

### ✅ Good Practices

- Validate on client and server
- Use schema validation
- Sanitize input
- Provide clear errors
- Validate early

### ❌ Anti-Patterns

- Don't trust client validation
- Don't skip sanitization
- Don't ignore validation errors

## Related Rules

- Form Validation: `.cursor/rules/09-表单验证.mdc`
- Security: `.cursor/rules/21-安全规范.mdc`
