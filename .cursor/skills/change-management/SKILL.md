---
name: change-management
description: Manage changes including change requests, approval processes, and change tracking. Use when managing changes or implementing change control.
---

# Change Management

Manage changes effectively.

## Quick Checklist

When managing changes:

- [ ] **Change** request created
- [ ] **Impact** assessed
- [ ] **Approval** obtained
- [ ] **Change** implemented
- [ ] **Verification** performed

## Change Request

### 1. Change Template

```typescript
interface ChangeRequest {
  id: string;
  description: string;
  impact: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  approval: string[];
  status: "pending" | "approved" | "rejected" | "completed";
}
```

## Best Practices

### ✅ Good Practices

- Document changes
- Assess impact
- Get approval
- Test changes
- Verify results

### ❌ Anti-Patterns

- Don't skip approval
- Don't ignore impact
- Don't skip testing

## Related Rules

- Git Operations: `.cursor/skills/git-operations/SKILL.md`
