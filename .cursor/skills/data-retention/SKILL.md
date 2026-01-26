---
name: data-retention
description: Implement data retention policies including retention periods, data archival, and data deletion. Use when managing data lifecycle or implementing retention policies.
---

# Data Retention

Implement data retention policies.

## Quick Checklist

When implementing retention:

- [ ] **Retention** policy defined
- [ ] **Archival** configured
- [ ] **Deletion** automated
- [ ] **Compliance** verified
- [ ] **Monitoring** set up

## Retention Policy

### 1. Data Lifecycle

```typescript
interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  archivalDays?: number;
  deletionDays: number;
}

async function applyRetentionPolicy(policy: RetentionPolicy) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
  
  // Archive old data
  if (policy.archivalDays) {
    await archiveData(cutoffDate);
  }
  
  // Delete very old data
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() - policy.deletionDays);
  await deleteData(deletionDate);
}
```

## Best Practices

### ✅ Good Practices

- Define clear policies
- Automate retention
- Archive before delete
- Comply with regulations
- Monitor compliance

### ❌ Anti-Patterns

- Don't skip policies
- Don't ignore compliance
- Don't delete without archive

## Related Rules

- Compliance Audit: `.cursor/skills/compliance-audit/SKILL.md`
