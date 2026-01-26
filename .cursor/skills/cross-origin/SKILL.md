---
name: cross-origin
description: Configure CORS including allowed origins, methods, headers, and credentials. Use when configuring cross-origin requests or API access control.
---

# Cross-Origin Configuration

Configure CORS properly.

## Quick Checklist

When configuring CORS:

- [ ] **Allowed origins** defined
- [ ] **Methods** specified
- [ ] **Headers** configured
- [ ] **Credentials** handled
- [ ] **Security** verified

## CORS Configuration

### 1. CORS Setup

```typescript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://example.com",
      "https://app.example.com",
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
```

## Best Practices

### ✅ Good Practices

- Whitelist origins
- Specify methods
- Limit headers
- Handle credentials carefully
- Test CORS

### ❌ Anti-Patterns

- Don't use wildcard origins
- Don't allow all methods
- Don't skip security

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
