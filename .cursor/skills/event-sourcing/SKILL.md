---
name: event-sourcing
description: Implement event sourcing including event storage, event replay, and event-driven architecture. Use when implementing event sourcing or CQRS patterns.
---

# Event Sourcing

Implement event sourcing patterns.

## Quick Checklist

When implementing event sourcing:

- [ ] **Event store** configured
- [ ] **Events** defined
- [ ] **Event handlers** implemented
- [ ] **Replay** mechanism implemented
- [ ] **Snapshots** configured (if needed)

## Event Store

### 1. Event Storage

```typescript
interface Event {
  id: string;
  type: string;
  aggregateId: string;
  data: unknown;
  timestamp: Date;
}

class EventStore {
  async append(aggregateId: string, events: Event[]) {
    // Store events
  }

  async getEvents(aggregateId: string): Promise<Event[]> {
    // Retrieve events
  }
}
```

## Best Practices

### ✅ Good Practices

- Store all events
- Make events immutable
- Implement replay
- Use snapshots for performance
- Version events

### ❌ Anti-Patterns

- Don't modify events
- Don't skip replay
- Don't ignore versioning

## Related Rules

- Database Operations: `.cursor/skills/database-operations/SKILL.md`
