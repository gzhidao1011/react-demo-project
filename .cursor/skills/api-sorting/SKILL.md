---
name: api-sorting
description: Implement API sorting including single and multi-field sorting, sort direction, and sort validation. Use when implementing sorting or ordering functionality.
---

# API Sorting

Implement API sorting.

## Quick Checklist

When implementing sorting:

- [ ] **Sort** parameters defined
- [ ] **Fields** validated
- [ ] **Direction** supported
- [ ] **Performance** optimized
- [ ] **Documentation** provided

## Sorting Implementation

### 1. Sort Parser

```typescript
interface Sort {
  field: string;
  direction: "asc" | "desc";
}

function parseSort(sortParam: string): Sort[] {
  return sortParam.split(",").map((s) => {
    const [field, direction = "asc"] = s.split(":");
    return { field, direction: direction as "asc" | "desc" };
  });
}

function applySort(query: QueryBuilder, sorts: Sort[]) {
  sorts.forEach((sort) => {
    query.orderBy(sort.field, sort.direction);
  });
  return query;
}
```

## Best Practices

### ✅ Good Practices

- Validate sort fields
- Support multiple fields
- Use indexes
- Document sortable fields
- Limit sort fields

### ❌ Anti-Patterns

- Don't allow arbitrary fields
- Don't skip validation
- Don't ignore indexes

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
