---
name: content-security
description: Implement content security policies including CSP headers, XSS protection, and security headers. Use when securing applications or implementing security policies.
---

# Content Security

Implement content security policies.

## Quick Checklist

When implementing security:

- [ ] **CSP headers** configured
- [ ] **Security headers** set
- [ ] **XSS protection** enabled
- [ ] **HTTPS** enforced
- [ ] **Security headers** tested

## Security Headers

### 1. Security Headers Configuration

```typescript
// apps/web/app/config/security.ts
export const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};
```

## Best Practices

### ✅ Good Practices

- Set CSP headers
- Enable security headers
- Use HTTPS
- Sanitize user input
- Regular security audits

### ❌ Anti-Patterns

- Don't skip security headers
- Don't allow unsafe inline scripts
- Don't ignore XSS risks

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
