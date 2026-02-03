# 生产环境创建 Admin 账号指南

本文档说明在生产环境中如何创建第一个 admin 账号，以及如何通过管理界面创建后续的 admin 账号。

## 前置条件

在生产环境中创建 admin 账号之前，需要确保：

1. ✅ 数据库迁移已完成（特别是 `V7__rbac_seed_data.sql`，创建了 ADMIN 角色和权限）
2. ✅ 应用已成功启动
3. ✅ 至少有一个可以登录的用户账号（用于访问管理界面）

## 场景一：首次部署（没有 admin 用户）

### 方案 A：临时启用自动初始化（推荐）

**步骤**：

1. **配置环境变量**（临时启用自动初始化）：

```bash
ADMIN_INIT_ENABLED=true
ADMIN_INIT_EMAIL=admin@yourcompany.com
ADMIN_INIT_PASSWORD=YourStrongPassword123!@#
ADMIN_INIT_NAME=Administrator
```

2. **启动应用**：应用启动时会自动创建 admin 用户

3. **验证创建**：查看应用日志，确认 admin 用户已创建

4. **立即禁用自动初始化**（重要！）：

```bash
ADMIN_INIT_ENABLED=false
```

5. **重启应用**：应用重启后，自动初始化功能已禁用

6. **使用创建的账号登录**：使用配置的邮箱和密码登录系统

### 方案 B：通过数据库直接创建（适合有数据库访问权限的场景）

如果无法使用自动初始化，可以通过数据库直接创建第一个 admin 用户：

**步骤**：

1. **连接到数据库**：

```bash
# 使用 MySQL 客户端连接
mysql -h <数据库地址> -u <用户名> -p <数据库名>
```

2. **查找 ADMIN 角色 ID**：

```sql
SELECT id, code, name FROM roles WHERE code = 'ADMIN' AND deleted_at IS NULL;
```

假设 ADMIN 角色的 ID 是 `1`。

3. **创建 admin 用户**（需要先获取密码的 BCrypt 哈希值）：

```sql
-- 插入用户（密码需要是 BCrypt 哈希值）
-- 注意：以下密码哈希值对应密码 "ChangeMe123!@#"
-- 实际使用时，需要通过应用生成 BCrypt 哈希值
INSERT INTO users (name, email, phone, password, email_verified, created_at, updated_at, deleted_at)
VALUES (
  'Administrator',
  'admin@yourcompany.com',
  NULL,
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZ5Z5Z5u', -- 这是示例，需要替换为实际密码的哈希值
  true,
  NOW(),
  NOW(),
  NULL
);

-- 获取刚创建的用户 ID（假设是 1）
SET @user_id = LAST_INSERT_ID();

-- 分配 ADMIN 角色（假设 ADMIN 角色 ID 是 1）
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES (@user_id, 1, NOW());
```

**重要提示**：密码哈希值需要通过应用生成。可以通过以下方式获取：

- 临时启用自动初始化（方案 A）
- 使用应用的密码加密功能生成哈希值
- 使用在线 BCrypt 生成工具（不推荐，安全风险）

## 场景二：已有 admin 用户（通过管理界面创建）

如果系统中已经有一个 admin 用户，可以通过管理界面创建新的 admin 用户：

### 操作步骤

1. **登录管理界面**：
   - 访问：`https://your-domain.com/admin` 或 `https://your-domain.com/admin/users`
   - 使用现有的 admin 账号登录

2. **进入用户管理页面**：
   - 在侧边栏点击"用户管理"（User Management）
   - 或直接访问：`https://your-domain.com/admin/users`

3. **创建新用户**：
   - 点击"新建用户"（Create User）按钮
   - 或访问：`https://your-domain.com/admin/users/new`

4. **填写用户信息**：
   - **姓名**：输入用户姓名（例如：`Administrator`）
   - **邮箱**：输入邮箱地址（例如：`admin@yourcompany.com`）
   - **手机号**（可选）：输入手机号
   - **密码**：输入强密码（必须符合密码策略）
   - **角色**：选择 `ADMIN` 角色（点击角色标签选择）

5. **提交表单**：
   - 点击"创建用户"（Create User）按钮
   - 系统会验证表单并创建用户

6. **验证创建**：
   - 创建成功后，会自动跳转到用户列表页面
   - 可以看到新创建的用户，确认其角色为 `ADMIN`

### 密码策略要求

创建用户时，密码必须符合以下策略：

- ✅ 最小长度：8 个字符
- ✅ 必须包含大写字母（A-Z）
- ✅ 必须包含小写字母（a-z）
- ✅ 必须包含数字（0-9）
- ✅ 必须包含特殊字符（如：!@#$%^&*）

**示例强密码**：
- `Admin@2024!`
- `SecurePass123!@#`
- `MyStrongP@ssw0rd`

### 权限要求

只有具备 `ADMIN` 角色的用户才能：

- ✅ 访问管理界面（`/admin/*`）
- ✅ 创建新用户
- ✅ 编辑用户信息
- ✅ 分配角色
- ✅ 删除用户（软删除）
- ✅ 管理角色和权限

## 场景三：忘记 admin 密码

如果忘记了 admin 密码，可以通过以下方式重置：

### 方案 A：通过数据库重置（需要数据库访问权限）

1. **连接到数据库**

2. **查找用户 ID**：

```sql
SELECT id, email FROM users WHERE email = 'admin@yourcompany.com' AND deleted_at IS NULL;
```

3. **生成新密码的 BCrypt 哈希值**（需要通过应用或工具生成）

4. **更新密码**：

```sql
UPDATE users 
SET password = '<新密码的BCrypt哈希值>', 
    updated_at = NOW()
WHERE email = 'admin@yourcompany.com' AND deleted_at IS NULL;
```

### 方案 B：通过其他 admin 用户重置

如果有其他 admin 用户：

1. 使用其他 admin 账号登录
2. 进入用户管理页面
3. 找到需要重置密码的用户
4. 编辑用户信息（注意：当前版本可能不支持直接修改密码，需要通过其他方式）

## 安全最佳实践

### 生产环境建议

1. **禁用自动初始化**：
   ```bash
   ADMIN_INIT_ENABLED=false
   ```

2. **使用强密码**：
   - 至少 16 位
   - 包含大小写字母、数字和特殊字符
   - 定期更换（建议每 90 天）

3. **限制 admin 用户数量**：
   - 只创建必要的 admin 用户
   - 定期审查 admin 用户列表

4. **启用审计日志**：
   - 系统会自动记录所有用户管理操作
   - 定期检查审计日志

5. **使用 HTTPS**：
   - 确保管理界面使用 HTTPS
   - 防止密码在传输过程中被窃取

6. **定期备份**：
   - 定期备份数据库
   - 确保可以恢复用户数据

### 访问控制

- ✅ 管理界面仅对 ADMIN 角色用户开放
- ✅ 所有操作都会记录到审计日志
- ✅ 密码使用 BCrypt 加密存储
- ✅ 支持软删除，可以恢复误删的用户

## 故障排查

### 问题：无法访问管理界面

**可能原因**：
1. 用户未登录
2. 用户没有 ADMIN 角色
3. 应用未正确启动

**解决方法**：
1. 确认用户已登录
2. 检查用户角色（必须是 ADMIN）
3. 查看应用日志，确认应用正常运行

### 问题：创建用户失败

**可能原因**：
1. 邮箱已存在
2. 密码不符合策略
3. 网络错误

**解决方法**：
1. 检查邮箱是否已存在
2. 确认密码符合策略要求
3. 查看浏览器控制台和网络请求，确认错误信息

### 问题：无法选择 ADMIN 角色

**可能原因**：
1. ADMIN 角色不存在
2. 角色列表加载失败

**解决方法**：
1. 确认数据库迁移已执行（`V7__rbac_seed_data.sql`）
2. 检查角色管理页面，确认 ADMIN 角色存在
3. 查看浏览器控制台，确认 API 请求是否成功

## 相关文档

- [Admin 账号初始化指南](./admin-initialization.md) - 开发环境自动初始化
- [用户与权限管理后台实现计划](../.cursor/plans/用户与权限管理后台实现计划/) - 系统设计文档

## 总结

在生产环境中创建 admin 账号的最佳实践：

1. **首次部署**：临时启用自动初始化，创建第一个 admin 后立即禁用
2. **后续创建**：通过管理界面创建，确保安全可控
3. **安全措施**：使用强密码、限制 admin 数量、启用审计日志
4. **定期审查**：定期检查 admin 用户列表和审计日志
