---
name: chaos-engineering
description: Implement chaos engineering including fault injection, resilience testing, and failure simulation. Use when testing system resilience or implementing chaos experiments.
---

# Chaos Engineering

Implement chaos engineering practices.

## Quick Checklist

When implementing chaos:

- [ ] **Hypothesis** defined
- [ ] **Experiment** designed
- [ ] **Blast radius** limited
- [ ] **Monitoring** configured
- [ ] **Rollback** plan ready

## Chaos Experiments

### 1. Fault Injection

```typescript
class ChaosEngine {
  async injectLatency(service: string, delay: number) {
    // Inject latency
  }

  async injectFailure(service: string, probability: number) {
    if (Math.random() < probability) {
      throw new Error("Chaos injection: Service failure");
    }
  }
}
```

## Best Practices

### ✅ Good Practices

- Start small
- Limit blast radius
- Monitor closely
- Have rollback plan
- Document learnings

### ❌ Anti-Patterns

- Don't test in production first
- Don't skip monitoring
- Don't ignore safety

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
