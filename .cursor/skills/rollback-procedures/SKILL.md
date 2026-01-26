---
name: rollback-procedures
description: Plan and execute rollback procedures including automated rollback, manual rollback, and rollback testing. Use when planning rollbacks or executing rollback procedures.
---

# Rollback Procedures

Plan and execute rollbacks.

## Quick Checklist

When planning rollback:

- [ ] **Rollback** procedure defined
- [ ] **Automation** configured
- [ ] **Testing** performed
- [ ] **Monitoring** during rollback
- [ ] **Documentation** updated

## Rollback Implementation

### 1. Automated Rollback

```typescript
async function deployWithRollback(version: string) {
  try {
    await deploy(version);
    await verifyHealth();
  } catch (error) {
    console.error("Deployment failed, rolling back");
    await rollback();
    throw error;
  }
}
```

## Best Practices

### ✅ Good Practices

- Plan rollback procedure
- Automate when possible
- Test rollback
- Monitor during rollback
- Document process

### ❌ Anti-Patterns

- Don't skip planning
- Don't ignore failures
- Don't skip testing

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
