---
name: api-versioning
description: Implement API versioning strategies including URL versioning, header versioning, and backward compatibility. Use when versioning APIs or managing API evolution.
---

# API Versioning

Implement API versioning strategies.

## Quick Checklist

When versioning APIs:

- [ ] **Versioning strategy** selected
- [ ] **Version** in URL or header
- [ ] **Backward compatibility** maintained
- [ ] **Deprecation** policy defined
- [ ] **Documentation** updated

## Versioning Strategies

### 1. URL Versioning

```typescript
// /api/v1/users
// /api/v2/users

export const apiRoutes = {
  v1: "/api/v1",
  v2: "/api/v2",
};
```

### 2. Header Versioning

```typescript
// Accept: application/vnd.api+json;version=2

const version = request.headers["accept-version"] || "1";
```

## Best Practices

### ✅ Good Practices

- Use consistent strategy
- Maintain backward compatibility
- Document version changes
- Deprecate old versions gradually
- Provide migration guides

### ❌ Anti-Patterns

- Don't break backward compatibility
- Don't skip versioning
- Don't ignore deprecation

## Related Rules

- API Structure: `.cursor/rules/06-API结构.mdc`
