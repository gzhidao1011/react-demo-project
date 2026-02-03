# Admin 登录问题排查指南

## 问题描述

尝试使用以下凭据登录时返回 40100 错误（邮箱或密码错误）：

- **邮箱**: `admin@example.com`
- **密码**: `ChangeMe123!@#`

## 排查步骤

### 1. 检查管理员账户是否已创建

#### 方式 A：查看应用日志

查看 `user-service` 的启动日志，查找以下信息：

```bash
# 如果初始化成功，会看到：
INFO  AdminInitializationService - Admin user initialized successfully: email=admin@example.com, name=Administrator

# 如果用户已存在，会看到：
INFO  AdminInitializationService - Admin user with email admin@example.com already exists. Skipping initialization.

# 如果初始化失败，会看到：
ERROR AdminInitializationService - Failed to initialize admin user
```

#### 方式 B：直接查询数据库

连接到数据库并执行以下 SQL：

```sql
-- 查询管理员用户（邮箱转换为小写）
SELECT id, name, email, email_verified, created_at 
FROM users 
WHERE LOWER(email) = 'admin@example.com' 
AND deleted_at IS NULL;

-- 查询用户角色
SELECT u.id, u.email, r.code as role_code, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE LOWER(u.email) = 'admin@example.com' 
AND u.deleted_at IS NULL;
```

**预期结果**：
- 应该有一条用户记录，`email_verified` 为 `true`
- 应该有一个 `ADMIN` 角色关联

### 2. 检查环境变量配置

确认 `services/.env` 文件中的配置：

```bash
ADMIN_INIT_ENABLED=true
ADMIN_INIT_EMAIL=admin@example.com
ADMIN_INIT_PASSWORD=ChangeMe123!@#
ADMIN_INIT_NAME=Administrator
```

**注意**：
- 确保 `.env` 文件在 `services/` 目录下
- 如果使用 Docker Compose，确保环境变量正确传递

### 3. 检查 ADMIN 角色是否存在

执行以下 SQL 查询：

```sql
SELECT id, code, name FROM roles WHERE code = 'ADMIN' AND deleted_at IS NULL;
```

**预期结果**：应该有一条 `ADMIN` 角色记录

如果不存在，需要执行数据库迁移：

```bash
# 确保 Flyway 迁移已执行
# 检查 V7__rbac_seed_data.sql 是否已执行
```

### 4. 验证密码是否正确

如果用户已存在但密码不正确，可以通过以下方式重置：

#### 方式 A：重新初始化（如果用户不存在）

1. 删除现有用户（如果存在）：
```sql
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com');
DELETE FROM users WHERE LOWER(email) = 'admin@example.com';
```

2. 重启 `user-service`，确保环境变量正确配置

3. 查看日志确认初始化成功

#### 方式 B：通过应用生成密码哈希

如果需要手动更新密码，需要通过应用生成 BCrypt 哈希值。可以：

1. 临时创建一个测试用户，查看密码哈希格式
2. 或使用 Spring Security 的 `BCryptPasswordEncoder` 生成哈希

### 5. 检查邮箱大小写

**重要**：登录时邮箱会被转换为小写，确保数据库中的邮箱也是小写。

执行以下 SQL 检查：

```sql
-- 检查邮箱格式
SELECT id, email, LOWER(email) as normalized_email 
FROM users 
WHERE email LIKE '%admin%' 
AND deleted_at IS NULL;
```

如果邮箱不是小写，可以更新：

```sql
UPDATE users 
SET email = LOWER(email) 
WHERE email != LOWER(email) 
AND deleted_at IS NULL;
```

### 6. 验证登录 API

使用以下 PowerShell 脚本测试登录（确保邮箱和密码正确）：

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

**预期响应**：
```json
{
    "code": 0,
    "message": "登录成功",
    "data": {
        "accessToken": "...",
        "refreshToken": "...",
        "user": {
            "id": "1",
            "email": "admin@example.com",
            "username": "Administrator"
        }
    }
}
```

## 常见问题

### Q1: 初始化日志显示跳过，但登录失败

**原因**：可能是邮箱大小写不一致，或密码不匹配

**解决**：
1. 检查数据库中的邮箱是否为小写
2. 确认密码是否正确
3. 如果密码不确定，删除用户后重新初始化

### Q2: 初始化日志显示失败

**原因**：可能是数据库连接问题、ADMIN 角色不存在、或其他异常

**解决**：
1. 查看完整的错误日志
2. 确认数据库连接正常
3. 确认 ADMIN 角色存在
4. 检查数据库权限

### Q3: 环境变量未生效

**原因**：Docker Compose 可能未正确加载 `.env` 文件

**解决**：
1. 确认 `docker-compose.yml` 中使用了 `env_file: services/.env`
2. 或直接在 `docker-compose.yml` 中设置环境变量
3. 重启服务

### Q4: 登录时提示邮箱未验证

**原因**：`email_verified` 字段为 `false`

**解决**：
```sql
UPDATE users 
SET email_verified = true, 
    email_verified_at = NOW() 
WHERE LOWER(email) = 'admin@example.com' 
AND deleted_at IS NULL;
```

## 快速修复脚本

如果确认用户不存在或需要重新创建，可以使用以下 SQL：

```sql
-- 1. 删除现有用户（如果存在）
DELETE FROM user_roles WHERE user_id IN (
    SELECT id FROM users WHERE LOWER(email) = 'admin@example.com'
);
DELETE FROM users WHERE LOWER(email) = 'admin@example.com';

-- 2. 查找 ADMIN 角色 ID
SET @admin_role_id = (SELECT id FROM roles WHERE code = 'ADMIN' AND deleted_at IS NULL);

-- 3. 创建用户（密码哈希需要从应用获取）
-- 注意：以下密码哈希是示例，需要替换为实际密码的 BCrypt 哈希
INSERT INTO users (name, email, phone, password, email_verified, created_at, updated_at, deleted_at)
VALUES (
    'Administrator',
    'admin@example.com',  -- 确保是小写
    NULL,
    '$2a$12$...',  -- 需要替换为实际密码的 BCrypt 哈希
    true,
    NOW(),
    NOW(),
    NULL
);

-- 4. 分配 ADMIN 角色
SET @user_id = LAST_INSERT_ID();
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES (@user_id, @admin_role_id, NOW());
```

**重要**：密码哈希必须通过应用生成，不能手动创建。

## 推荐解决方案

1. **确保环境变量正确配置**：检查 `services/.env` 文件
2. **重启 user-service**：让初始化服务重新执行
3. **查看日志**：确认初始化是否成功
4. **验证登录**：使用正确的邮箱和密码登录

如果问题仍然存在，请提供：
- 应用启动日志（特别是 AdminInitializationService 相关日志）
- 数据库查询结果（用户和角色信息）
- 登录 API 的完整错误响应
