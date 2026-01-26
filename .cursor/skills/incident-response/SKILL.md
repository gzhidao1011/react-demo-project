---
name: incident-response
description: Plan and execute incident response including incident detection, escalation procedures, and post-incident reviews. Use when responding to incidents or planning incident procedures.
---

# Incident Response

Plan and execute incident response.

## Quick Checklist

When responding to incidents:

- [ ] **Incident** detected
- [ ] **Severity** assessed
- [ ] **Team** notified
- [ ] **Response** executed
- [ ] **Post-mortem** conducted

## Incident Response Plan

### 1. Response Procedures

```typescript
interface Incident {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: Date;
}

class IncidentResponse {
  async handleIncident(incident: Incident) {
    // 1. Assess severity
    // 2. Notify team
    // 3. Execute response
    // 4. Document
    // 5. Post-mortem
  }
}
```

## Best Practices

### ✅ Good Practices

- Have response plan
- Define severity levels
- Automate detection
- Document incidents
- Conduct post-mortems

### ❌ Anti-Patterns

- Don't skip planning
- Don't ignore incidents
- Don't skip post-mortems

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
