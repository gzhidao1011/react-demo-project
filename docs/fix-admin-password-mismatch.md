# 修复 Admin 密码不匹配问题

## 问题分析

数据库中已有管理员账户，但登录失败，最可能的原因是：**密码不匹配**。

### 可能的原因

1. **初始化时环境变量未正确传递**：`make dev` 启动时，环境变量可能没有正确传递到 Spring Boot 应用
2. **初始化时使用了错误的密码**：可能使用了默认值、空值或其他密码
3. **密码哈希无法直接查看**：BCrypt 哈希无法反向解密，只能通过验证匹配

## 快速诊断

### 1. 检查用户角色

```sql
-- 连接到数据库
docker exec -it mysql mysql -uroot -proot123 user_db

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
WHERE u.email = 'admin@repo.com' 
OR LOWER(u.email) = 'admin@repo.com';
```

**预期结果**：应该看到 `ADMIN` 角色

### 2. 测试密码（自动化脚本）

运行密码测试脚本：

```powershell
cd services
.\verify-admin-password.ps1
```

这会测试多个常见密码，看哪个能匹配。

### 3. 检查环境变量

```powershell
# 检查当前环境变量
$env:ADMIN_INIT_PASSWORD
```

## 解决方案

### 方案一：删除用户后重新初始化（推荐）

这是最简单可靠的方法：

#### 步骤 1：删除现有用户

```powershell
# 方式 A：使用 SQL 脚本（推荐）
cd services
docker exec -i mysql mysql -uroot -proot123 user_db < fix-admin-password.sql

# 方式 B：手动执行 SQL
docker exec -it mysql mysql -uroot -proot123 user_db
```

在 MySQL 中执行：
```sql
-- 删除用户角色
DELETE FROM user_roles 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE LOWER(email) = 'admin@repo.com'
);

-- 删除用户
DELETE FROM users 
WHERE LOWER(email) = 'admin@repo.com';
```

#### 步骤 2：设置环境变量

```powershell
cd services

# 设置环境变量（确保密码与 .env 文件一致）
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@repo.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
$env:ADMIN_INIT_NAME = "Administrator"
```

**重要**：确保密码与 `services/.env` 文件中的 `ADMIN_INIT_PASSWORD` 一致！

#### 步骤 3：重启 user-service

```powershell
# 停止当前的 make dev（Ctrl+C）
# 然后重新启动 user-service
make user

# 或使用启动脚本（会自动加载 .env）
.\dev-with-env.ps1
```

#### 步骤 4：查看初始化日志

在启动日志中查找：
```
INFO  AdminInitializationService - Admin user initialized successfully: email=admin@repo.com, name=Administrator
```

#### 步骤 5：验证登录

```powershell
$body = @{
    email = "admin@repo.com"
    password = "ChangeMe123!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5573/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 方案二：通过管理界面重置密码（如果有其他 admin 用户）

如果有其他可以登录的 admin 用户：
1. 登录管理界面
2. 进入用户管理页面
3. 找到 `admin@repo.com` 用户
4. 编辑用户信息，重置密码

### 方案三：手动更新密码哈希（不推荐，复杂）

如果需要手动更新密码，需要通过应用生成 BCrypt 哈希值。这比较复杂，不推荐。

## 完整修复脚本

创建一个一键修复脚本 `services/fix-admin-account.ps1`：

```powershell
# ==================== 一键修复 Admin 账户 ====================

Write-Host "🔧 修复 Admin 账户..." -ForegroundColor Cyan
Write-Host ""

# 1. 删除现有用户
Write-Host "1. 删除现有用户..." -ForegroundColor Yellow
docker exec -i mysql mysql -uroot -proot123 user_db -e @"
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@repo.com');
DELETE FROM users WHERE LOWER(email) = 'admin@repo.com';
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ 用户已删除" -ForegroundColor Green
} else {
    Write-Host "   ✗ 删除失败" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. 设置环境变量
Write-Host "2. 设置环境变量..." -ForegroundColor Yellow
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@repo.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
$env:ADMIN_INIT_NAME = "Administrator"

Write-Host "   ✓ 环境变量已设置" -ForegroundColor Green
Write-Host ""

# 3. 提示重启服务
Write-Host "3. 请重启 user-service：" -ForegroundColor Yellow
Write-Host "   - 停止当前的 make dev（Ctrl+C）" -ForegroundColor White
Write-Host "   - 运行: make user" -ForegroundColor White
Write-Host "   - 或运行: .\dev-with-env.ps1" -ForegroundColor White
Write-Host ""
```

## 验证清单

修复后，请验证：

- [ ] 用户已从数据库中删除
- [ ] 环境变量 `ADMIN_INIT_PASSWORD` 已设置为 `ChangeMe123!@#`
- [ ] `user-service` 已重启
- [ ] 初始化日志显示成功创建用户
- [ ] 登录 API 返回成功响应
- [ ] 用户有 `ADMIN` 角色

## 预防措施

为了避免将来再次出现此问题：

1. **使用启动脚本**：使用 `dev-with-env.ps1` 启动，确保环境变量正确加载
2. **检查初始化日志**：每次启动后检查日志，确认初始化成功
3. **统一密码配置**：确保 `.env` 文件中的密码与登录时使用的密码一致

## 相关文档

- [Admin 登录问题排查指南](./troubleshooting-admin-login.md)
- [make dev 启动修复指南](./fix-admin-login-make-dev.md)
- [Admin 账户诊断指南](./diagnose-admin-account.md)
