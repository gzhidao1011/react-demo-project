---
name: api-throttling
description: Implement API throttling including request throttling, adaptive throttling, and priority-based throttling. Use when throttling API requests or managing API load.
---

# API Throttling

Implement API throttling.

## Quick Checklist

When implementing throttling:

- [ ] **Throttling** strategy selected
- [ ] **Limits** configured
- [ ] **Priority** handling implemented
- [ ] **Monitoring** configured
- [ ] **Error** handling added

## Throttling Implementation

### 1. Adaptive Throttling

```typescript
class AdaptiveThrottler {
  private baseLimit: number;
  private currentLimit: number;
  
  adjustLimit(systemLoad: number) {
    if (systemLoad > 0.8) {
      this.currentLimit = this.baseLimit * 0.5;
    } else if (systemLoad < 0.3) {
      this.currentLimit = this.baseLimit * 1.5;
    }
  }
}
```

## Best Practices

### ✅ Good Practices

- Use adaptive throttling
- Set priorities
- Monitor system load
- Handle errors
- Adjust dynamically

### ❌ Anti-Patterns

- Don't skip throttling
- Don't ignore load
- Don't skip monitoring

## Related Rules

- Throttling: `.cursor/skills/throttling/SKILL.md`
