# 快速修复 Admin 登录问题

## 问题原因

`docker-compose.yml` 中的 `user-service` 服务**没有加载 `services/.env` 文件**，导致管理员初始化环境变量无法传递到容器中。

## 已修复

✅ 已在 `docker-compose.yml` 中为 `user-service` 添加了 `env_file` 配置
✅ 已修复 `AdminInitializationService.java` 中的邮箱大小写问题

## 解决步骤

### 1. 确认环境变量配置

确认 `services/.env` 文件中有以下配置：

```bash
ADMIN_INIT_ENABLED=true
ADMIN_INIT_EMAIL=admin@example.com
ADMIN_INIT_PASSWORD=ChangeMe123!@#
ADMIN_INIT_NAME=Administrator
ADMIN_INIT_PHONE=13800138000
```

### 2. 重启 user-service 服务

```bash
# 方式一：重启单个服务（推荐）
docker-compose restart user-service

# 方式二：停止并重新启动（如果重启无效）
docker-compose stop user-service
docker-compose up -d user-service

# 方式三：重新构建并启动（如果代码有修改）
docker-compose up -d --build user-service
```

### 3. 查看初始化日志

```bash
# 查看 user-service 日志，确认管理员账户是否已创建
docker-compose logs -f user-service | grep -i "admin"
```

**成功日志示例**：
```
INFO  AdminInitializationService - Admin user initialized successfully: email=admin@example.com, name=Administrator
```

**如果用户已存在**：
```
INFO  AdminInitializationService - Admin user with email admin@example.com already exists. Skipping initialization.
```

### 4. 如果用户已存在但密码不正确

如果日志显示用户已存在，但登录仍然失败，可能需要：

#### 选项 A：删除现有用户并重新初始化（推荐）

```bash
# 1. 连接到数据库
docker exec -it mysql mysql -uroot -proot123 user_db

# 2. 删除现有用户
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com');
DELETE FROM users WHERE LOWER(email) = 'admin@example.com';

# 3. 退出数据库
exit

# 4. 重启 user-service
docker-compose restart user-service

# 5. 查看日志确认初始化成功
docker-compose logs -f user-service | grep -i "admin"
```

#### 选项 B：手动更新密码（需要生成 BCrypt 哈希）

如果需要手动更新密码，需要通过应用生成 BCrypt 哈希值。最简单的方式是删除用户后重新初始化。

### 5. 验证登录

使用以下 PowerShell 脚本测试登录：

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

**预期成功响应**：
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

## 验证清单

- [ ] `services/.env` 文件存在且配置正确
- [ ] `docker-compose.yml` 已更新（包含 `env_file` 配置）
- [ ] `user-service` 已重启
- [ ] 日志显示管理员账户初始化成功
- [ ] 登录 API 返回成功响应

## 常见问题

### Q: 重启后仍然无法登录

**检查**：
1. 确认日志中显示初始化成功
2. 检查数据库中的用户是否存在：
   ```sql
   SELECT id, email, email_verified FROM users WHERE LOWER(email) = 'admin@example.com';
   ```
3. 检查用户是否有 ADMIN 角色：
   ```sql
   SELECT u.email, r.code 
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE LOWER(u.email) = 'admin@example.com';
   ```

### Q: 日志显示跳过初始化（用户已存在）

**解决**：删除现有用户后重新初始化（见步骤 4）

### Q: 环境变量未生效

**检查**：
1. 确认 `services/.env` 文件路径正确
2. 确认 `docker-compose.yml` 中使用了 `env_file: ./services/.env`
3. 重启服务后查看容器环境变量：
   ```bash
   docker exec user-service env | grep ADMIN_INIT
   ```

## 相关文档

- [Admin 登录问题排查指南](./troubleshooting-admin-login.md) - 详细排查步骤
- [Admin 账号初始化指南](./admin-initialization.md) - 初始化配置说明
- [生产环境创建 Admin 账号](./admin-creation-production.md) - 生产环境最佳实践
