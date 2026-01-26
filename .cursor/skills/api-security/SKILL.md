---
name: api-security
description: Secure APIs including authentication, authorization, input validation, and security headers. Use when securing APIs or implementing security measures.
---

# API Security

Secure APIs comprehensively.

## Quick Checklist

When securing APIs:

- [ ] **Authentication** implemented
- [ ] **Authorization** configured
- [ ] **Input** validated
- [ ] **Security** headers set
- [ ] **Audit** logging enabled

## Security Implementation

### 1. API Security

```typescript
// Authentication middleware
function authenticate(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}

// Authorization middleware
function authorize(requiredRole: string) {
  return (req: Request) => {
    const user = req.user;
    if (!user.roles.includes(requiredRole)) {
      throw new Error("Forbidden");
    }
  };
}
```

## Best Practices

### ✅ Good Practices

- Authenticate all requests
- Authorize properly
- Validate input
- Set security headers
- Log security events

### ❌ Anti-Patterns

- Don't skip authentication
- Don't trust input
- Don't ignore security

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- Authentication: `.cursor/skills/authentication-authorization/SKILL.md`
