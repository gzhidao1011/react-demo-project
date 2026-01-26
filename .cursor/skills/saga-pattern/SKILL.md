---
name: saga-pattern
description: Implement Saga pattern for distributed transactions including choreography and orchestration sagas. Use when managing distributed transactions or implementing long-running processes.
---

# Saga Pattern

Implement Saga pattern for distributed transactions.

## Quick Checklist

When implementing Saga:

- [ ] **Saga** type selected
- [ ] **Steps** defined
- [ ] **Compensation** implemented
- [ ] **Orchestration** configured
- [ ] **Monitoring** set up

## Saga Implementation

### 1. Orchestration Saga

```typescript
class OrderSaga {
  async execute(order: Order) {
    try {
      await this.reserveInventory(order);
      await this.processPayment(order);
      await this.shipOrder(order);
    } catch (error) {
      await this.compensate(order);
      throw error;
    }
  }

  async compensate(order: Order) {
    // Compensate all steps
    await this.cancelShipment(order);
    await this.refundPayment(order);
    await this.releaseInventory(order);
  }
}
```

## Best Practices

### ✅ Good Practices

- Define compensation
- Handle failures
- Monitor sagas
- Test compensation
- Document steps

### ❌ Anti-Patterns

- Don't skip compensation
- Don't ignore failures
- Don't skip monitoring

## Related Rules

- Transaction Management: `.cursor/skills/transaction-management/SKILL.md`
