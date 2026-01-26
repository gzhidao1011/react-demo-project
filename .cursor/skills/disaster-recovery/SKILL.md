---
name: disaster-recovery
description: Plan and implement disaster recovery including backup strategies, recovery procedures, and RTO/RPO targets. Use when planning disaster recovery or testing recovery procedures.
---

# Disaster Recovery

Plan and implement disaster recovery.

## Quick Checklist

When planning DR:

- [ ] **RTO/RPO** targets defined
- [ ] **Backup** strategy implemented
- [ ] **Recovery** procedures documented
- [ ] **DR testing** scheduled
- [ ] **Failover** configured

## Disaster Recovery Plan

### 1. Recovery Procedures

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

# 1. Restore database
./scripts/restore-database.sh latest-backup.sql

# 2. Restore files
./scripts/restore-files.sh latest-files.tar.gz

# 3. Verify services
./scripts/verify-services.sh

# 4. Notify team
echo "Disaster recovery completed"
```

## Best Practices

### ✅ Good Practices

- Define RTO/RPO
- Regular backups
- Test recovery
- Document procedures
- Automate where possible

### ❌ Anti-Patterns

- Don't skip testing
- Don't ignore RTO/RPO
- Don't forget documentation

## Related Rules

- Backup Recovery: `.cursor/skills/backup-recovery/SKILL.md`
