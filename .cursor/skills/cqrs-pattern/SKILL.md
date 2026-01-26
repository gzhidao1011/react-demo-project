---
name: cqrs-pattern
description: Implement CQRS pattern including command/query separation, read/write models, and event sourcing integration. Use when implementing CQRS or separating read/write operations.
---

# CQRS Pattern

Implement CQRS pattern.

## Quick Checklist

When implementing CQRS:

- [ ] **Commands** defined
- [ ] **Queries** defined
- [ ] **Read model** created
- [ ] **Write model** created
- [ ] **Synchronization** configured

## CQRS Implementation

### 1. Command Handler

```typescript
interface Command {
  type: string;
  data: unknown;
}

class CreateUserCommand implements Command {
  type = "CREATE_USER";
  constructor(public data: { name: string; email: string }) {}
}

class CommandHandler {
  async handle(command: Command) {
    // Write to write model
    await writeModel.save(command.data);
    // Publish event
    eventBus.publish("UserCreated", command.data);
  }
}
```

## Best Practices

### ✅ Good Practices

- Separate commands/queries
- Use read models
- Sync models
- Handle consistency
- Monitor sync

### ❌ Anti-Patterns

- Don't mix read/write
- Don't skip sync
- Don't ignore consistency

## Related Rules

- Event Sourcing: `.cursor/skills/event-sourcing/SKILL.md`
