---
name: message-queue
description: Implement message queue systems including RabbitMQ, Kafka, or Redis queues. Use when implementing asynchronous processing or event-driven architecture.
---

# Message Queue

Implement message queue systems.

## Quick Checklist

When implementing queues:

- [ ] **Queue system** selected
- [ ] **Producers** implemented
- [ ] **Consumers** implemented
- [ ] **Error handling** added
- [ ] **Monitoring** configured

## Redis Queue

### 1. Queue Implementation

```typescript
import Redis from "ioredis";

const redis = new Redis();

export async function enqueue(job: string, data: unknown) {
  await redis.lpush(`queue:${job}`, JSON.stringify(data));
}

export async function dequeue(job: string) {
  const data = await redis.brpop(`queue:${job}`, 0);
  return data ? JSON.parse(data[1]) : null;
}
```

## Best Practices

### ✅ Good Practices

- Use appropriate queue system
- Handle failures gracefully
- Implement retries
- Monitor queue depth
- Set up dead letter queues

### ❌ Anti-Patterns

- Don't ignore failures
- Don't skip monitoring
- Don't lose messages

## Related Rules

- Database Operations: `.cursor/skills/database-operations/SKILL.md`
