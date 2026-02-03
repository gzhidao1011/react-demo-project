# 诊断 Admin 账户问题

## 快速诊断步骤

### 1. 检查数据库中的用户数据

连接到数据库并执行以下查询：

```sql
-- 连接到数据库
docker exec -it mysql mysql -uroot -proot123 user_db

-- 查询管理员用户信息
SELECT 
    id,
    name,
    email,
    LOWER(email) as normalized_email,
    email_verified,
    created_at,
    updated_at,
    deleted_at
FROM users 
WHERE email LIKE '%admin%' OR name LIKE '%Administrator%'
ORDER BY created_at DESC;

-- 检查邮箱是否是小写
SELECT 
    id,
    email,
    CASE 
        WHEN email = LOWER(email) THEN '✓ 小写'
        ELSE '✗ 需要转换为小写'
    END as email_case_status
FROM users 
WHERE email LIKE '%admin%' 
AND deleted_at IS NULL;
```

### 2. 检查用户角色

```sql
-- 查询用户角色
SELECT 
    u.id,
    u.email,
    u.name,
    r.code as role_code,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE '%admin%' 
AND u.deleted_at IS NULL;
```

**预期结果**：应该看到 `ADMIN` 角色

### 3. 检查 email_verified 状态

```sql
-- 检查邮箱验证状态
SELECT 
    id,
    email,
    email_verified,
    email_verified_at
FROM users 
WHERE email LIKE '%admin%' 
AND deleted_at IS NULL;
```

**预期结果**：`email_verified` 应该为 `1` (true)

## 常见问题及修复

### 问题 1：邮箱不是小写

**症状**：数据库中的邮箱可能是 `Admin@Example.com` 而不是 `admin@example.com`

**修复**：
```sql
-- 更新邮箱为小写
UPDATE users 
SET email = LOWER(email),
    updated_at = NOW()
WHERE email != LOWER(email) 
AND email LIKE '%admin%'
AND deleted_at IS NULL;
```

### 问题 2：email_verified 为 false

**症状**：`email_verified` 字段为 `0` (false)

**修复**：
```sql
-- 设置邮箱为已验证
UPDATE users 
SET email_verified = true,
    email_verified_at = NOW(),
    updated_at = NOW()
WHERE email LIKE '%admin%' 
AND email_verified = false
AND deleted_at IS NULL;
```

### 问题 3：没有 ADMIN 角色

**症状**：用户存在但没有 `ADMIN` 角色

**修复**：
```sql
-- 查找 ADMIN 角色 ID
SET @admin_role_id = (SELECT id FROM roles WHERE code = 'ADMIN' AND deleted_at IS NULL);

-- 查找用户 ID
SET @user_id = (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com' AND deleted_at IS NULL);

-- 分配 ADMIN 角色（如果还没有）
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT @user_id, @admin_role_id, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = @user_id AND role_id = @admin_role_id
);
```

### 问题 4：密码不匹配（最可能的原因）

**症状**：用户存在但密码验证失败

**原因**：初始化时可能没有读取到环境变量，使用了错误的密码或空密码

**修复方案 A：删除用户后重新初始化（推荐）**

```sql
-- 1. 删除现有用户
SET @user_id = (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com' AND deleted_at IS NULL);

DELETE FROM user_roles WHERE user_id = @user_id;
DELETE FROM users WHERE id = @user_id;

-- 2. 确保环境变量已设置
-- 在 PowerShell 中：
cd services
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@example.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
$env:ADMIN_INIT_NAME = "Administrator"

-- 3. 重启 user-service（使用 Ctrl+C 停止 make dev，然后重新启动）
make user
```

**修复方案 B：手动更新密码（需要生成 BCrypt 哈希）**

如果需要手动更新密码，需要通过应用生成 BCrypt 哈希值。最简单的方式是：

1. 创建一个临时的测试用户，查看密码哈希格式
2. 或者使用方案 A（删除后重新初始化）

## 完整诊断和修复脚本

创建一个 SQL 脚本 `fix-admin-account.sql`：

```sql
-- ==================== Admin 账户诊断和修复脚本 ====================

USE user_db;

-- 1. 诊断：显示当前用户状态
SELECT '=== 当前用户状态 ===' as info;
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN email = LOWER(email) THEN '✓'
        ELSE '✗'
    END as email_lowercase,
    email_verified,
    created_at
FROM users 
WHERE email LIKE '%admin%' 
AND deleted_at IS NULL;

-- 2. 诊断：显示用户角色
SELECT '=== 用户角色 ===' as info;
SELECT 
    u.email,
    r.code as role_code,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE '%admin%' 
AND u.deleted_at IS NULL;

-- 3. 修复：更新邮箱为小写
UPDATE users 
SET email = LOWER(email),
    updated_at = NOW()
WHERE email != LOWER(email) 
AND email LIKE '%admin%'
AND deleted_at IS NULL;

-- 4. 修复：设置邮箱为已验证
UPDATE users 
SET email_verified = true,
    email_verified_at = COALESCE(email_verified_at, NOW()),
    updated_at = NOW()
WHERE email LIKE '%admin%' 
AND email_verified = false
AND deleted_at IS NULL;

-- 5. 修复：确保有 ADMIN 角色
SET @admin_role_id = (SELECT id FROM roles WHERE code = 'ADMIN' AND deleted_at IS NULL);
SET @user_id = (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com' AND deleted_at IS NULL);

INSERT INTO user_roles (user_id, role_id, created_at)
SELECT @user_id, @admin_role_id, NOW()
WHERE @user_id IS NOT NULL 
AND @admin_role_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = @user_id AND role_id = @admin_role_id
);

-- 6. 验证：显示修复后的状态
SELECT '=== 修复后的状态 ===' as info;
SELECT 
    u.id,
    u.email,
    u.email_verified,
    GROUP_CONCAT(r.code) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE '%admin%' 
AND u.deleted_at IS NULL
GROUP BY u.id, u.email, u.email_verified;
```

**使用方法**：
```bash
# 执行修复脚本
docker exec -i mysql mysql -uroot -proot123 user_db < fix-admin-account.sql
```

## 推荐解决方案

如果密码不匹配，最简单的解决方法是：

### 步骤 1：删除现有用户

```sql
-- 连接到数据库
docker exec -it mysql mysql -uroot -proot123 user_db

-- 删除现有用户
SET @user_id = (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com' AND deleted_at IS NULL);
DELETE FROM user_roles WHERE user_id = @user_id;
DELETE FROM users WHERE id = @user_id;
```

### 步骤 2：确保环境变量已设置

```powershell
cd services

# 设置环境变量
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@example.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
$env:ADMIN_INIT_NAME = "Administrator"
```

### 步骤 3：重启 user-service

```powershell
# 停止当前的 make dev（Ctrl+C）
# 然后重新启动 user-service
make user

# 或者使用脚本启动
.\dev-with-env.ps1
```

### 步骤 4：查看初始化日志

在启动日志中查找：
```
INFO  AdminInitializationService - Admin user initialized successfully: email=admin@example.com, name=Administrator
```

### 步骤 5：验证登录

```powershell
$body = @{
    email = "admin@example.com"
    password = "ChangeMe123!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5573/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## 验证清单

- [ ] 数据库中的邮箱是小写（`admin@example.com`）
- [ ] `email_verified` 为 `true`
- [ ] 用户有 `ADMIN` 角色
- [ ] 环境变量 `ADMIN_INIT_PASSWORD` 与登录时使用的密码一致
- [ ] 初始化日志显示成功创建用户
