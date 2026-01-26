---
name: api-relationships
description: Handle API relationships including includes, embedded resources, and relationship links. Use when implementing related resources or optimizing API calls.
---

# API Relationships

Handle API relationships.

## Quick Checklist

When handling relationships:

- [ ] **Include** parameter supported
- [ ] **Embedding** configured
- [ ] **Links** provided
- [ ] **Performance** optimized
- [ ] **Documentation** provided

## Relationship Implementation

### 1. Include Relationships

```typescript
async function getUserWithRelations(userId: string, includes: string[]) {
  const user = await getUser(userId);
  
  if (includes.includes("orders")) {
    user.orders = await getOrdersByUserId(userId);
  }
  
  if (includes.includes("profile")) {
    user.profile = await getProfileByUserId(userId);
  }
  
  return user;
}

// Usage: ?include=orders,profile
```

## Best Practices

### ✅ Good Practices

- Support includes
- Optimize queries
- Limit depth
- Document relationships
- Handle circular references

### ❌ Anti-Patterns

- Don't allow deep nesting
- Don't skip optimization
- Don't ignore N+1 queries

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
