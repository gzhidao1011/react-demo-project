---
name: migration-management
description: Manage database migrations, data migrations, and schema changes. Use when creating migrations or managing database schema evolution.
---

# Migration Management

Manage database migrations and schema changes.

## Quick Checklist

When managing migrations:

- [ ] **Migration file** created
- [ ] **Up migration** implemented
- [ ] **Down migration** implemented
- [ ] **Migration tested** locally
- [ ] **Migration applied** to staging
- [ ] **Rollback plan** prepared

## Database Migrations

### 1. Migration Template

```sql
-- migrations/V001__create_users_table.sql
-- Up migration
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- Down migration (rollback)
-- DROP TABLE users;
```

### 2. Migration Script

```typescript
// scripts/migrate.ts
import { readFileSync } from "fs";
import { glob } from "glob";

interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
}

export function loadMigrations(): Migration[] {
  const files = glob.sync("migrations/V*.sql");
  
  return files.map((file) => {
    const content = readFileSync(file, "utf-8");
    const [up, down] = content.split("-- Down migration");
    
    return {
      version: extractVersion(file),
      name: extractName(file),
      up: up.replace("-- Up migration", "").trim(),
      down: down?.trim() || "",
    };
  });
}
```

## Data Migrations

### 1. Data Migration Script

```typescript
// migrations/data/V002__migrate_user_emails.ts
export async function up(db: Database) {
  // Migrate data
  await db.query(`
    UPDATE users 
    SET email = LOWER(email)
    WHERE email != LOWER(email)
  `);
}

export async function down(db: Database) {
  // Rollback (if possible)
  // Note: This may not be fully reversible
}
```

## Best Practices

### ✅ Good Practices

- Version migrations properly
- Test migrations locally first
- Include rollback scripts
- Document migration purpose
- Run migrations in transactions
- Backup before migration

### ❌ Anti-Patterns

- Don't skip testing migrations
- Don't forget rollback scripts
- Don't run migrations without backup
- Don't modify existing migrations

## Related Rules

- Database Operations: `.cursor/skills/database-operations/SKILL.md`
