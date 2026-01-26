---
name: database-operations
description: Handle database operations including migrations, query optimization, schema design, and data management. Use when working with databases, creating migrations, optimizing queries, or managing database schemas.
---

# Database Operations

Handle database operations following best practices and project standards.

## Quick Checklist

When working with databases:

- [ ] **Schema design** follows best practices
- [ ] **Migrations** are versioned and reversible
- [ ] **Indexes** added for frequently queried columns
- [ ] **Queries** optimized (avoid N+1, use JOINs)
- [ ] **Transactions** used for related operations
- [ ] **Backups** configured and tested
- [ ] **Connection pooling** configured

## Database Schema Design

### 1. Table Design Best Practices

```sql
-- ✅ Good: Proper table design
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ❌ Bad: Missing indexes, no timestamps
CREATE TABLE users (
  id INT,
  username VARCHAR(50),
  email VARCHAR(255)
);
```

### 2. Foreign Keys

```sql
-- ✅ Good: Foreign key constraints
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Data Types

```sql
-- ✅ Good: Appropriate data types
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  stock INT UNSIGNED DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Migrations

### 1. Migration File Structure

```sql
-- Migration: V1__create_users_table.sql
-- Description: Create users table

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Migration Naming Convention

```
V<version>__<description>.sql

Examples:
- V1__create_users_table.sql
- V2__add_email_verification_to_users.sql
- V3__create_orders_table.sql
```

### 3. Reversible Migrations

```sql
-- Up migration: V2__add_phone_to_users.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email;
CREATE INDEX idx_phone ON users(phone);

-- Down migration: V2__add_phone_to_users_down.sql
DROP INDEX idx_phone ON users;
ALTER TABLE users DROP COLUMN phone;
```

## Query Optimization

### 1. Use Indexes

```sql
-- ✅ Good: Query uses index
SELECT * FROM users WHERE email = 'user@example.com';
-- Uses idx_email index

-- ❌ Bad: Query doesn't use index
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';
-- Can't use index due to function
```

### 2. Avoid N+1 Queries

```sql
-- ❌ Bad: N+1 queries
SELECT * FROM orders;
-- Then for each order: SELECT * FROM users WHERE id = ?;

-- ✅ Good: Use JOIN
SELECT 
  o.id,
  o.total,
  o.created_at,
  u.username,
  u.email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 3. Limit Results

```sql
-- ✅ Good: Limit results
SELECT * FROM orders 
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- ❌ Bad: Fetch all records
SELECT * FROM orders WHERE user_id = ?;
```

### 4. Use EXPLAIN

```sql
-- Analyze query performance
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- Check if index is used
EXPLAIN SELECT * FROM orders WHERE user_id = 123;
```

## Transactions

### 1. Use Transactions for Related Operations

```java
// ✅ Good: Use transaction
@Transactional
public void createOrder(Order order, List<OrderItem> items) {
  orderRepository.save(order);
  items.forEach(item -> {
    item.setOrderId(order.getId());
    orderItemRepository.save(item);
    // Update product stock
    productRepository.decreaseStock(item.getProductId(), item.getQuantity());
  });
}
```

### 2. Handle Transaction Errors

```java
@Transactional(rollbackFor = Exception.class)
public void transferMoney(Long fromAccountId, Long toAccountId, BigDecimal amount) {
  try {
    accountRepository.decreaseBalance(fromAccountId, amount);
    accountRepository.increaseBalance(toAccountId, amount);
  } catch (Exception e) {
    // Transaction automatically rolls back
    throw new TransferException("Transfer failed", e);
  }
}
```

## Connection Pooling

### 1. Configure Connection Pool

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 2. Monitor Connection Pool

```java
@Autowired
private DataSource dataSource;

public void checkConnectionPool() {
  HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
  HikariPoolMXBean poolBean = hikariDataSource.getHikariPoolMXBean();
  
  System.out.println("Active connections: " + poolBean.getActiveConnections());
  System.out.println("Idle connections: " + poolBean.getIdleConnections());
  System.out.println("Total connections: " + poolBean.getTotalConnections());
}
```

## Database Initialization

### 1. Initialization Scripts

```sql
-- docker/mysql/init/01-init-databases.sql
CREATE DATABASE IF NOT EXISTS user_db 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS order_db 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON user_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON order_db.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

### 2. Migration Scripts

```sql
-- services/user-service/src/main/resources/db/migration/V1__init_users.sql
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_username ON users(username);
```

## Best Practices

### ✅ Good Practices

- Use appropriate data types
- Add indexes for frequently queried columns
- Use foreign keys for data integrity
- Use transactions for related operations
- Limit query results
- Use JOINs instead of N+1 queries
- Configure connection pooling
- Version migrations
- Test migrations before production

### ❌ Anti-Patterns

- Don't use SELECT * in production
- Don't ignore indexes
- Don't use N+1 queries
- Don't forget transactions for related operations
- Don't hardcode database credentials
- Don't skip migration testing
- Don't use functions on indexed columns in WHERE clauses

## Common Database Operations

### 1. Create Table

```sql
CREATE TABLE table_name (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  column1 VARCHAR(255) NOT NULL,
  column2 INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_column1 (column1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Add Column

```sql
ALTER TABLE table_name 
ADD COLUMN new_column VARCHAR(255) AFTER existing_column;
```

### 3. Add Index

```sql
CREATE INDEX idx_column_name ON table_name(column_name);
```

### 4. Update Data

```sql
UPDATE table_name 
SET column1 = 'value', updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

### 5. Delete Data

```sql
DELETE FROM table_name WHERE id = ?;
```

## Troubleshooting

### Issue 1: Slow Queries

**Solution**:
- Use EXPLAIN to analyze query
- Add indexes for WHERE/JOIN columns
- Optimize query structure
- Consider query caching

### Issue 2: Connection Pool Exhausted

**Solution**:
- Increase pool size
- Check for connection leaks
- Optimize query performance
- Use connection timeout

### Issue 3: Migration Fails

**Solution**:
- Check migration syntax
- Verify database state
- Test migration on staging first
- Have rollback plan ready

## Related Rules

- Service Integration: `.cursor/skills/service-integration/SKILL.md`
- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- Security Audit: `.cursor/skills/security-audit/SKILL.md`
