---
name: api-pagination
description: Implement API pagination including offset-based, cursor-based, and page-based pagination. Use when paginating API responses or handling large datasets.
---

# API Pagination

Implement API pagination.

## Quick Checklist

When implementing pagination:

- [ ] **Pagination** strategy selected
- [ ] **Parameters** defined
- [ ] **Response** format standardized
- [ ] **Links** provided
- [ ] **Performance** optimized

## Pagination Implementation

### 1. Offset-Based Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function paginate<T>(
  query: QueryBuilder,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<T>> {
  const offset = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    query.limit(pageSize).offset(offset).execute(),
    query.count().execute(),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

## Best Practices

### ✅ Good Practices

- Use appropriate strategy
- Standardize format
- Provide links
- Set max page size
- Optimize queries

### ❌ Anti-Patterns

- Don't skip pagination
- Don't use offset for large datasets
- Don't ignore performance

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
