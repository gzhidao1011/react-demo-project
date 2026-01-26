---
name: api-error-handling
description: Implement API error handling including error formats, status codes, and error responses. Use when handling API errors or standardizing error responses.
---

# API Error Handling

Implement comprehensive API error handling.

## Quick Checklist

When handling errors:

- [ ] **Error** format standardized
- [ ] **Status codes** used correctly
- [ ] **Error** messages provided
- [ ] **Error** logging implemented
- [ ] **Documentation** updated

## Error Response Format

### 1. Standardized Errors

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    traceId?: string;
  };
}

function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        details,
        traceId: generateTraceId(),
      },
    },
    { status }
  );
}
```

## Best Practices

### ✅ Good Practices

- Use standard format
- Use correct status codes
- Provide helpful messages
- Include trace IDs
- Log errors

### ❌ Anti-Patterns

- Don't expose internals
- Don't skip status codes
- Don't ignore logging

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
