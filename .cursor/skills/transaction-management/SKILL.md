---
name: transaction-management
description: Manage database transactions including ACID properties, transaction isolation, and distributed transactions. Use when managing transactions or ensuring data consistency.
---

# Transaction Management

Manage database transactions effectively.

## Quick Checklist

When managing transactions:

- [ ] **Transaction** boundaries defined
- [ ] **Isolation level** selected
- [ ] **Rollback** strategy implemented
- [ ] **Deadlock** handling added
- [ ] **Timeout** configured

## Transaction Implementation

### 1. Database Transaction

```typescript
async function transferMoney(from: string, to: string, amount: number) {
  const transaction = await db.beginTransaction();
  
  try {
    await transaction.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, from]);
    await transaction.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, to]);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

## Best Practices

### ✅ Good Practices

- Keep transactions short
- Use appropriate isolation level
- Handle rollbacks
- Avoid deadlocks
- Set timeouts

### ❌ Anti-Patterns

- Don't hold transactions long
- Don't skip rollbacks
- Don't ignore deadlocks

## Related Rules

- Database Operations: `.cursor/skills/database-operations/SKILL.md`
