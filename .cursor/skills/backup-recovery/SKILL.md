---
name: backup-recovery
description: Implement backup and recovery strategies including database backups, file backups, and disaster recovery procedures. Use when setting up backup systems or recovering from failures.
---

# Backup & Recovery

Implement backup and recovery strategies.

## Quick Checklist

When setting up backups:

- [ ] **Backup strategy** defined
- [ ] **Automated backups** configured
- [ ] **Backup storage** secured
- [ ] **Recovery procedures** documented
- [ ] **Backup testing** scheduled
- [ ] **Retention policy** set

## Database Backup

### 1. MySQL Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mydb"
DB_USER="root"
DB_PASSWORD="${MYSQL_PASSWORD}"

mkdir -p "$BACKUP_DIR"

# Create backup
docker exec mysql mysqldump \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  "$DB_NAME" > "$BACKUP_DIR/backup_${DATE}.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_${DATE}.sql"

# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_${DATE}.sql.gz"
```

### 2. Automated Backup

```yaml
# .github/workflows/backup.yml
name: Daily Backup

on:
  schedule:
    - cron: "0 2 * * *" # 2 AM daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Backup database
        run: ./scripts/backup-database.sh
      - name: Upload to storage
        run: |
          # Upload to cloud storage
          aws s3 cp backups/ s3://backups/ --recursive
```

## File Backup

### 1. File Backup Script

```bash
#!/bin/bash
# scripts/backup-files.sh

BACKUP_DIR="./backups/files"
SOURCE_DIR="./uploads"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Create archive
tar -czf "$BACKUP_DIR/files_${DATE}.tar.gz" "$SOURCE_DIR"

# Upload to remote storage
# rsync -avz "$BACKUP_DIR/" user@backup-server:/backups/
```

## Recovery Procedures

### 1. Database Recovery

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE="$1"
DB_NAME="mydb"
DB_USER="root"
DB_PASSWORD="${MYSQL_PASSWORD}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | docker exec -i mysql mysql \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    "$DB_NAME"
else
  docker exec -i mysql mysql \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    "$DB_NAME" < "$BACKUP_FILE"
fi

echo "Database restored from $BACKUP_FILE"
```

## Best Practices

### ✅ Good Practices

- Automate backups
- Test recovery procedures
- Store backups offsite
- Encrypt sensitive backups
- Document recovery steps
- Set retention policies
- Monitor backup success

### ❌ Anti-Patterns

- Don't skip backup testing
- Don't store backups only locally
- Don't ignore backup failures
- Don't skip encryption

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
