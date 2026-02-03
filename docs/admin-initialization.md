# Admin 账号初始化指南

本文档说明如何在项目初始化时配置 admin 账号，采用符合国外主流做法的方式。

## 概述

项目采用**环境变量配置 + 应用启动时自动初始化**的方式创建初始 admin 账号，符合以下最佳实践：

1. ✅ **通过环境变量配置**：不硬编码密码，提高安全性
2. ✅ **幂等性**：如果 admin 用户已存在，不会重复创建
3. ✅ **可配置**：生产环境可通过环境变量禁用自动初始化
4. ✅ **自动分配角色**：自动分配 ADMIN 角色和所有权限

## 配置方式

### 1. 环境变量配置

在 `.env` 文件或环境变量中配置以下变量：

```bash
# 是否启用 admin 账号自动初始化（默认：true）
# 生产环境建议设为 false，通过管理界面手动创建 admin 账号
ADMIN_INIT_ENABLED=true

# Admin 账号邮箱（必填，如果启用初始化）
ADMIN_INIT_EMAIL=admin@example.com

# Admin 账号密码（必填，如果启用初始化）
# 注意：生产环境必须使用强密码（符合密码策略）
ADMIN_INIT_PASSWORD=ChangeMe123!@#

# Admin 账号姓名（可选，默认：Administrator）
ADMIN_INIT_NAME=Administrator

# Admin 账号手机号（可选）
ADMIN_INIT_PHONE=
```

### 2. 本地开发环境

**方式一：使用 `.env` 文件（推荐）**

在 `services/.env` 文件中配置：

```bash
ADMIN_INIT_ENABLED=true
ADMIN_INIT_EMAIL=admin@example.com
ADMIN_INIT_PASSWORD=ChangeMe123!@#
ADMIN_INIT_NAME=Administrator
```

**方式二：使用环境变量**

```bash
export ADMIN_INIT_ENABLED=true
export ADMIN_INIT_EMAIL=admin@example.com
export ADMIN_INIT_PASSWORD=ChangeMe123!@#
```

### 3. Docker 环境

在 `docker-compose.yml` 或 `services/.env` 中配置：

```yaml
services:
  user-service:
    environment:
      - ADMIN_INIT_ENABLED=true
      - ADMIN_INIT_EMAIL=admin@example.com
      - ADMIN_INIT_PASSWORD=ChangeMe123!@#
      - ADMIN_INIT_NAME=Administrator
```

或在 `services/.env` 文件中配置（推荐）：

```bash
ADMIN_INIT_ENABLED=true
ADMIN_INIT_EMAIL=admin@example.com
ADMIN_INIT_PASSWORD=ChangeMe123!@#
ADMIN_INIT_NAME=Administrator
```

### 4. 生产环境

**推荐做法**：禁用自动初始化，通过管理界面手动创建 admin 账号

```bash
ADMIN_INIT_ENABLED=false
```

或者不设置 `ADMIN_INIT_EMAIL` 和 `ADMIN_INIT_PASSWORD`，初始化服务会自动跳过。

## 工作原理

1. **应用启动时**：`AdminInitializationService` 的 `@PostConstruct` 方法会被调用
2. **检查配置**：如果 `ADMIN_INIT_ENABLED=false` 或未配置邮箱/密码，跳过初始化
3. **检查用户**：如果 admin 用户已存在（通过邮箱判断），跳过初始化
4. **创建用户**：创建 admin 用户并自动分配 ADMIN 角色
5. **日志记录**：初始化过程会记录到日志中

## 密码策略

Admin 账号密码必须符合以下策略（在 `application.yml` 中配置）：

- 最小长度：8 个字符
- 必须包含大写字母
- 必须包含小写字母
- 必须包含数字
- 必须包含特殊字符

**示例强密码**：
- `ChangeMe123!@#`
- `Admin@2024!`
- `SecurePass123!`

## 安全建议

### 开发环境

- ✅ 使用简单的密码便于开发（但仍需符合密码策略）
- ✅ 在 `.env` 文件中配置，不要提交到 Git
- ✅ 使用 `.env.example` 作为模板

### 生产环境

- ✅ **禁用自动初始化**：设置 `ADMIN_INIT_ENABLED=false`
- ✅ **手动创建 admin**：通过管理界面或数据库迁移脚本创建
- ✅ **使用强密码**：至少 16 位，包含大小写字母、数字和特殊字符
- ✅ **定期更换密码**：建议每 90 天更换一次
- ✅ **启用双因素认证**（如果支持）

## 验证初始化

### 1. 查看日志

应用启动时，如果初始化成功，会看到以下日志：

```
INFO  AdminInitializationService - Admin user initialized successfully: email=admin@example.com, name=Administrator
```

如果用户已存在，会看到：

```
INFO  AdminInitializationService - Admin user with email admin@example.com already exists. Skipping initialization.
```

### 2. 登录验证

使用配置的邮箱和密码登录系统，验证 admin 账号是否正常工作。

### 3. 检查角色

登录后，检查用户是否拥有 ADMIN 角色和所有权限。

## 故障排查

### 问题：Admin 用户未创建

**可能原因**：
1. 环境变量未配置或配置错误
2. `ADMIN_INIT_ENABLED=false`
3. ADMIN 角色不存在（需要先执行数据库迁移）

**解决方法**：
1. 检查环境变量是否正确配置
2. 查看应用日志，确认初始化服务是否执行
3. 确认数据库迁移已执行（特别是 `V7__rbac_seed_data.sql`）

### 问题：密码不符合策略

**错误信息**：密码验证失败

**解决方法**：确保密码符合密码策略要求（至少 8 位，包含大小写字母、数字和特殊字符）

### 问题：邮箱已存在

**日志信息**：`Admin user with email xxx already exists. Skipping initialization.`

**说明**：这是正常行为，如果 admin 用户已存在，不会重复创建。

**解决方法**：如果需要重新创建，先删除现有用户，或使用不同的邮箱。

## 生产环境使用

**重要**：生产环境建议禁用自动初始化，通过管理界面手动创建 admin 账号。

详细操作指南请参考：[生产环境创建 Admin 账号指南](./admin-creation-production.md)

## 相关文件

- `services/user-service/src/main/java/com/example/user/config/AdminInitializationProperties.java` - 配置类
- `services/user-service/src/main/java/com/example/user/service/AdminInitializationService.java` - 初始化服务
- `services/user-service/src/main/resources/application.yml` - 配置文件
- `services/.env.example` - 环境变量示例

## 相关文档

- [生产环境创建 Admin 账号指南](./admin-creation-production.md) - 生产环境手动创建 admin 账号的详细步骤

## 参考

- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config.typesafe-configuration-properties)
- [Environment Variables Best Practices](https://12factor.net/config)
