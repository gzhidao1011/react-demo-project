---
name: domain-driven-design
description: Apply Domain-Driven Design including bounded contexts, aggregates, value objects, and domain events. Use when modeling domains or implementing DDD.
---

# Domain-Driven Design

Apply Domain-Driven Design principles.

## Quick Checklist

When applying DDD:

- [ ] **Domain** modeled
- [ ] **Bounded contexts** defined
- [ ] **Aggregates** identified
- [ ] **Value objects** created
- [ ] **Domain events** defined

## DDD Concepts

### 1. Aggregate

```typescript
class OrderAggregate {
  private order: Order;
  private orderItems: OrderItem[];

  addItem(item: OrderItem) {
    // Business logic
    this.orderItems.push(item);
    this.raiseEvent(new OrderItemAdded(item));
  }
}
```

## Best Practices

### ✅ Good Practices

- Model domain carefully
- Define bounded contexts
- Use aggregates
- Create value objects
- Use domain events

### ❌ Anti-Patterns

- Don't ignore domain
- Don't mix contexts
- Don't skip modeling

## Related Rules

- Clean Architecture: `.cursor/skills/clean-architecture/SKILL.md`
