---
name: api-filtering
description: Implement API filtering including query parameters, filter operators, and filter validation. Use when implementing filtering or search functionality.
---

# API Filtering

Implement API filtering.

## Quick Checklist

When implementing filtering:

- [ ] **Filter** parameters defined
- [ ] **Operators** supported
- [ ] **Validation** implemented
- [ ] **Performance** optimized
- [ ] **Documentation** provided

## Filtering Implementation

### 1. Query Filter

```typescript
interface Filter {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "like" | "in";
  value: unknown;
}

function applyFilters(query: QueryBuilder, filters: Filter[]) {
  filters.forEach((filter) => {
    switch (filter.operator) {
      case "eq":
        query.where(filter.field, "=", filter.value);
        break;
      case "like":
        query.where(filter.field, "LIKE", `%${filter.value}%`);
        break;
      // ... other operators
    }
  });
  return query;
}
```

## Best Practices

### ✅ Good Practices

- Support common operators
- Validate filters
- Optimize queries
- Document filters
- Limit complexity

### ❌ Anti-Patterns

- Don't allow SQL injection
- Don't skip validation
- Don't ignore performance

## Related Rules

- Search Functionality: `.cursor/skills/search-functionality/SKILL.md`
