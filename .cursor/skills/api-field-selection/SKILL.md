---
name: api-field-selection
description: Implement field selection including sparse fieldsets, field projection, and field validation. Use when optimizing API responses or implementing field selection.
---

# API Field Selection

Implement field selection.

## Quick Checklist

When implementing field selection:

- [ ] **Fields** parameter supported
- [ ] **Validation** implemented
- [ ] **Projection** applied
- [ ] **Performance** optimized
- [ ] **Documentation** provided

## Field Selection Implementation

### 1. Field Projection

```typescript
function selectFields<T>(data: T, fields: string[]): Partial<T> {
  const result: Partial<T> = {};
  fields.forEach((field) => {
    if (field in data) {
      result[field as keyof T] = data[field as keyof T];
    }
  });
  return result;
}

// Usage: ?fields=id,name,email
const fields = req.query.fields?.split(",") || [];
const projected = selectFields(user, fields);
```

## Best Practices

### ✅ Good Practices

- Support field selection
- Validate fields
- Optimize queries
- Document available fields
- Handle nested fields

### ❌ Anti-Patterns

- Don't skip validation
- Don't ignore performance
- Don't forget documentation

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
