---
name: security-headers
description: Configure security headers including CSP, HSTS, X-Frame-Options, and other security headers. Use when securing applications or implementing security policies.
---

# Security Headers

Configure security headers.

## Quick Checklist

When configuring headers:

- [ ] **CSP** configured
- [ ] **HSTS** enabled
- [ ] **X-Frame-Options** set
- [ ] **X-Content-Type-Options** set
- [ ] **Headers** tested

## Security Headers Configuration

### 1. Headers Setup

```typescript
export const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
};
```

## Best Practices

### ✅ Good Practices

- Set all security headers
- Use strict CSP
- Enable HSTS
- Test headers
- Monitor violations

### ❌ Anti-Patterns

- Don't skip security headers
- Don't use unsafe CSP
- Don't ignore violations

## Related Rules

- Content Security: `.cursor/skills/content-security/SKILL.md`
- Security: `.cursor/rules/21-安全规范.mdc`
