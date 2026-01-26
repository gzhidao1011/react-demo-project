---
name: event-driven
description: Implement event-driven architecture including event producers, consumers, event bus, and event sourcing. Use when implementing event-driven systems or event-based communication.
---

# Event-Driven Architecture

Implement event-driven architecture.

## Quick Checklist

When implementing EDA:

- [ ] **Events** defined
- [ ] **Producers** implemented
- [ ] **Consumers** implemented
- [ ] **Event bus** configured
- [ ] **Monitoring** set up

## Event-Driven Implementation

### 1. Event Bus

```typescript
class EventBus {
  private subscribers = new Map<string, Function[]>();

  subscribe(event: string, handler: Function) {
    const handlers = this.subscribers.get(event) || [];
    handlers.push(handler);
    this.subscribers.set(event, handlers);
  }

  publish(event: string, data: unknown) {
    const handlers = this.subscribers.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }
}
```

## Best Practices

### ✅ Good Practices

- Define event schema
- Use event bus
- Handle failures
- Monitor events
- Version events

### ❌ Anti-Patterns

- Don't ignore failures
- Don't skip monitoring
- Don't forget versioning

## Related Rules

- Event Sourcing: `.cursor/skills/event-sourcing/SKILL.md`
