---
name: audit-logging
description: Implement audit logging including user actions, system events, and compliance logging. Use when implementing audit trails or compliance requirements.
---

# Audit Logging

Implement audit logging.

## Quick Checklist

When implementing audit logs:

- [ ] **Events** identified
- [ ] **Logging** implemented
- [ ] **Storage** configured
- [ ] **Retention** policy set
- [ ] **Access** controlled

## Audit Log Implementation

### 1. Audit Logger

```typescript
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: "success" | "failure";
  ipAddress?: string;
}

class AuditLogger {
  async log(event: AuditLog) {
    await db.insert("audit_logs", event);
  }
}
```

## Best Practices

### ✅ Good Practices

- Log all critical actions
- Include context
- Store securely
- Set retention
- Control access

### ❌ Anti-Patterns

- Don't log sensitive data
- Don't skip logging
- Don't ignore retention

## Related Rules

- Logging Management: `.cursor/skills/logging-management/SKILL.md`
