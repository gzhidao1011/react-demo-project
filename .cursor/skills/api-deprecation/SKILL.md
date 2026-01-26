---
name: api-deprecation
description: Manage API deprecation including deprecation notices, sunset dates, and migration paths. Use when deprecating APIs or managing API lifecycle.
---

# API Deprecation

Manage API deprecation.

## Quick Checklist

When deprecating APIs:

- [ ] **Deprecation** notice added
- [ ] **Sunset** date set
- [ ] **Migration** guide provided
- [ ] **Timeline** communicated
- [ ] **Support** provided

## Deprecation Implementation

### 1. Deprecation Headers

```typescript
function setDeprecationHeaders(response: Response, sunsetDate: Date) {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", sunsetDate.toUTCString());
  response.headers.set("Link", '</api/v2/users>; rel="successor-version"');
}
```

## Best Practices

### ✅ Good Practices

- Give advance notice
- Set sunset dates
- Provide migration guides
- Support during transition
- Remove after sunset

### ❌ Anti-Patterns

- Don't deprecate abruptly
- Don't skip notices
- Don't ignore migration

## Related Rules

- API Versioning: `.cursor/skills/api-versioning/SKILL.md`
