---
name: async-processing
description: Implement asynchronous processing including job queues, background workers, and async task handling. Use when processing tasks asynchronously or implementing background jobs.
---

# Async Processing

Implement asynchronous processing.

## Quick Checklist

When implementing async processing:

- [ ] **Job queue** configured
- [ ] **Workers** implemented
- [ ] **Retry** mechanism added
- [ ] **Error handling** implemented
- [ ] **Monitoring** configured

## Job Queue Implementation

### 1. Job Queue

```typescript
interface Job {
  id: string;
  type: string;
  data: unknown;
  attempts: number;
}

class JobQueue {
  async enqueue(job: Job) {
    await redis.lpush("jobs", JSON.stringify(job));
  }

  async dequeue(): Promise<Job | null> {
    const data = await redis.brpop("jobs", 0);
    return data ? JSON.parse(data[1]) : null;
  }
}
```

## Best Practices

### ✅ Good Practices

- Use job queues
- Implement retries
- Handle failures
- Monitor jobs
- Set priorities

### ❌ Anti-Patterns

- Don't process synchronously
- Don't skip retries
- Don't ignore failures

## Related Rules

- Message Queue: `.cursor/skills/message-queue/SKILL.md`
