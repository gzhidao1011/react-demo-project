---
name: compliance-audit
description: Perform compliance audits including GDPR, CCPA, SOC 2, and other regulatory compliance checks. Use when auditing compliance or implementing compliance requirements.
---

# Compliance Audit

Perform compliance audits.

## Quick Checklist

When auditing compliance:

- [ ] **Regulations** identified
- [ ] **Requirements** documented
- [ ] **Gaps** identified
- [ ] **Remediation** planned
- [ ] **Documentation** updated

## GDPR Compliance

### 1. Data Protection

```typescript
// Right to be forgotten
async function deleteUserData(userId: string) {
  await db.deleteUser(userId);
  await cache.deleteUser(userId);
  await logs.anonymize(userId);
}
```

## Best Practices

### ✅ Good Practices

- Understand regulations
- Document compliance
- Implement data protection
- Regular audits
- Update policies

### ❌ Anti-Patterns

- Don't ignore regulations
- Don't skip documentation
- Don't forget data protection

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
