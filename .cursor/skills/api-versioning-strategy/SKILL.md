---
name: api-versioning-strategy
description: Define API versioning strategy including URL versioning, header versioning, and semantic versioning. Use when planning API versioning or managing API evolution.
---

# API Versioning Strategy

Define API versioning strategy.

## Quick Checklist

When versioning APIs:

- [ ] **Strategy** selected
- [ ] **Versioning** implemented
- [ ] **Backward** compatibility maintained
- [ ] **Deprecation** policy defined
- [ ] **Migration** guides provided

## Versioning Strategies

### 1. URL Versioning

```typescript
// /api/v1/users
// /api/v2/users

app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);
```

### 2. Header Versioning

```typescript
// Accept: application/vnd.api+json;version=2

const version = req.headers["accept-version"] || "1";
```

## Best Practices

### ✅ Good Practices

- Use consistent strategy
- Maintain compatibility
- Document changes
- Deprecate gradually
- Provide migration guides

### ❌ Anti-Patterns

- Don't break compatibility
- Don't skip versioning
- Don't ignore deprecation

## Related Rules

- API Versioning: `.cursor/skills/api-versioning/SKILL.md`
