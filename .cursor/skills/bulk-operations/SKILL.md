---
name: bulk-operations
description: Implement bulk operations including batch processing, bulk inserts, and batch updates. Use when processing large datasets or optimizing database operations.
---

# Bulk Operations

Implement bulk operations for efficiency.

## Quick Checklist

When implementing bulk operations:

- [ ] **Batch size** determined
- [ ] **Bulk API** implemented
- [ ] **Error handling** added
- [ ] **Progress tracking** implemented
- [ ] **Transaction** management

## Bulk Insert

### 1. Batch Insert

```typescript
async function bulkInsert(items: Item[], batchSize = 1000) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await db.insert(batch);
  }
}
```

## Best Practices

### ✅ Good Practices

- Use appropriate batch size
- Handle errors gracefully
- Track progress
- Use transactions
- Optimize queries

### ❌ Anti-Patterns

- Don't process all at once
- Don't skip error handling
- Don't ignore performance

## Related Rules

- Database Operations: `.cursor/skills/database-operations/SKILL.md`
