---
name: on-call-management
description: Manage on-call rotations including schedule management, escalation policies, and on-call tools. Use when setting up on-call or managing on-call schedules.
---

# On-Call Management

Manage on-call rotations.

## Quick Checklist

When managing on-call:

- [ ] **Schedule** created
- [ ] **Escalation** configured
- [ ] **Tools** set up
- [ ] **Runbooks** prepared
- [ ] **Training** provided

## On-Call Schedule

### 1. Rotation Setup

```typescript
interface OnCallSchedule {
  rotation: "weekly" | "daily";
  team: string[];
  escalation: EscalationPolicy;
}

interface EscalationPolicy {
  levels: {
    delay: number; // minutes
    notify: string[];
  }[];
}
```

## Best Practices

### ✅ Good Practices

- Rotate fairly
- Set clear escalation
- Provide runbooks
- Train team
- Review regularly

### ❌ Anti-Patterns

- Don't overload individuals
- Don't skip escalation
- Don't ignore training

## Related Rules

- Incident Response: `.cursor/skills/incident-response/SKILL.md`
