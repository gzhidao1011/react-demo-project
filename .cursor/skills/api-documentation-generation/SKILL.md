---
name: api-documentation-generation
description: Generate API documentation automatically including OpenAPI specs, interactive docs, and code examples. Use when generating API documentation or maintaining API docs.
---

# API Documentation Generation

Generate API documentation automatically.

## Quick Checklist

When generating docs:

- [ ] **OpenAPI** spec generated
- [ ] **Interactive** docs created
- [ ] **Examples** provided
- [ ] **Schemas** documented
- [ ] **Docs** published

## Documentation Generation

### 1. OpenAPI Generation

```typescript
import { OpenAPIV3 } from "openapi-types";

const spec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
  },
  paths: {
    "/api/users": {
      get: {
        summary: "Get users",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
    },
  },
};
```

## Best Practices

### ✅ Good Practices

- Generate automatically
- Include examples
- Keep updated
- Use OpenAPI
- Provide interactive docs

### ❌ Anti-Patterns

- Don't skip generation
- Don't use outdated docs
- Don't ignore examples

## Related Rules

- API Documentation: `.cursor/skills/api-documentation/SKILL.md`
