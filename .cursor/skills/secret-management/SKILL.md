---
name: secret-management
description: Manage secrets securely including secret storage, rotation, and access control. Use when managing secrets or implementing secret management systems.
---

# Secret Management

Manage secrets securely.

## Quick Checklist

When managing secrets:

- [ ] **Secret store** configured
- [ ] **Secrets** stored securely
- [ ] **Rotation** policy defined
- [ ] **Access control** configured
- [ ] **Audit** logging enabled

## Secret Management

### 1. Environment Variables

```typescript
// Use environment variables for secrets
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY not configured");
}
```

### 2. Secret Rotation

```bash
# Rotate secret
export NEW_SECRET=$(openssl rand -hex 32)
# Update in secret store
# Restart services
```

## Best Practices

### ✅ Good Practices

- Store secrets securely
- Rotate regularly
- Limit access
- Audit access
- Never commit secrets

### ❌ Anti-Patterns

- Don't hardcode secrets
- Don't commit secrets
- Don't skip rotation

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
