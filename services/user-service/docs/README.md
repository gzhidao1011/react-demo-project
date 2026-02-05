# User Service 用户服务

## 一、核心定位

`user-service` 是微服务架构中的**用户管理核心服务**，负责：
- ✅ 用户、角色、权限的完整 CRUD 操作
- ✅ 邮箱验证和密码重置功能
- ✅ 审计日志记录（敏感操作追踪）
- ✅ 用户偏好管理（如语言设置）
- ✅ JWT Token 管理和认证授权

---

## 二、目录结构

```
services/user-service/
├── src/main/java/com/example/user/
│   ├── UserServiceApplication.java          # 主启动类
│   ├── config/                              # 配置类
│   │   ├── FilterConfig.java                # 过滤器配置
│   │   ├── InternalApiSecretFilter.java     # 内部 API 密钥过滤器
│   │   └── JwtAuthFilter.java               # JWT 认证过滤器
│   ├── controller/                          # REST API 控制器层
│   │   ├── UserController.java              # 用户管理 API（CRUD、分页、软删除）
│   │   ├── LocaleController.java            # 用户语言偏好 API
│   │   └── PermissionController.java        # 权限查询 API
│   ├── service/                             # 业务逻辑层
│   │   ├── UserManagementService.java        # 用户/角色/权限管理核心服务
│   │   ├── UserServiceImpl.java              # Dubbo RPC 服务实现
│   │   ├── EmailVerificationService.java     # 邮箱验证服务
│   │   ├── PasswordResetService.java         # 密码重置服务
│   │   ├── PasswordPolicyService.java        # 密码策略服务
│   │   ├── JwtService.java                  # JWT Token 服务
│   │   └── AdminInitializationService.java   # 管理员初始化服务
│   ├── mapper/                              # MyBatis 数据访问层
│   │   ├── UserMapper.java
│   │   ├── RoleMapper.java
│   │   ├── PermissionMapper.java
│   │   ├── UserRoleMapper.java
│   │   ├── RolePermissionMapper.java
│   │   ├── AuditLogMapper.java
│   │   ├── EmailVerificationTokenMapper.java
│   │   └── PasswordResetTokenMapper.java
│   ├── entity/                              # 数据库实体类
│   │   ├── UserEntity.java
│   │   ├── RoleEntity.java
│   │   ├── PermissionEntity.java
│   │   ├── AuditLogEntity.java
│   │   ├── EmailVerificationTokenEntity.java
│   │   └── PasswordResetTokenEntity.java
│   └── job/                                 # 定时任务
│       └── PasswordResetTokenCleanupJob.java # Token 清理任务
├── src/main/resources/
│   ├── application.yml                      # 主配置文件
│   ├── application-docker.yml               # Docker 环境配置
│   ├── application-render.yml               # Render 平台配置
│   ├── db/migration/                        # Flyway 数据库迁移脚本
│   │   ├── V1__create_users_table.sql
│   │   ├── V2__add_password_to_users.sql
│   │   ├── V3__add_email_verification.sql
│   │   ├── V4__add_password_reset.sql
│   │   ├── V5__rbac_roles_permissions.sql
│   │   ├── V6__audit_log.sql
│   │   └── V7__rbac_seed_data.sql
│   ├── mapper/                              # MyBatis XML 映射文件
│   └── keys/                                # JWT 密钥文件
├── pom.xml                                  # Maven 依赖配置
├── Dockerfile                               # Docker 镜像构建
└── README-*.md                              # 文档（性能测试、安全扫描）
```

---

## 三、核心功能模块

### 1. 用户管理（User Management）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 分页查询 | 支持按 email/name/role/deleted 筛选，排序 | `UserController.getUsers()` |
| 用户详情 | 根据 ID 获取用户（含角色列表） | `UserController.getUserById()` |
| 创建用户 | 创建用户并分配角色 | `UserManagementService.createUser()` |
| 更新用户 | 更新用户信息和角色 | `UserManagementService.updateUser()` |
| 软删除 | 逻辑删除用户（保留数据） | `UserManagementService.softDeleteUser()` |
| 恢复用户 | 恢复已删除的用户 | `UserManagementService.restoreUser()` |

### 2. 角色权限管理（RBAC）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 角色管理 | CRUD 角色 | `UserManagementService` |
| 权限管理 | CRUD 权限 | `UserManagementService` |
| 角色权限关联 | 为角色分配权限 | `RolePermissionMapper` |
| 用户角色关联 | 为用户分配角色 | `UserRoleMapper` |
| 权限查询 | 查询用户/角色的权限列表 | `PermissionController` |

### 3. 邮箱验证（Email Verification）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 发送验证邮件 | 生成 Token 并发送邮件 | `EmailVerificationService.sendVerificationEmail()` |
| 验证邮箱 | 验证 Token 并标记邮箱已验证 | `EmailVerificationService.verifyEmail()` |
| Token 管理 | Token 存储、过期检查 | `EmailVerificationTokenMapper` |

### 4. 密码管理（Password Management）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 密码重置请求 | 生成重置 Token 并发送邮件 | `PasswordResetService.requestPasswordReset()` |
| 密码重置 | 验证 Token 并重置密码 | `PasswordResetService.resetPassword()` |
| 密码策略 | 密码强度校验 | `PasswordPolicyService` |
| Token 清理 | 定时清理过期 Token | `PasswordResetTokenCleanupJob` |

### 5. 用户偏好（User Preferences）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 语言偏好 | 获取/更新用户语言设置 | `LocaleController` |

### 6. 审计日志（Audit Logging）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 操作记录 | 记录敏感操作（创建/更新/删除用户） | `UserManagementService.writeAudit()` |
| 审计查询 | 查询操作历史 | `AuditLogMapper` |

### 7. 认证授权（Authentication & Authorization）

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| JWT 服务 | Token 生成、验证、刷新 | `JwtService` |
| JWT 过滤器 | 请求认证拦截 | `JwtAuthFilter` |
| 内部 API 保护 | 内部服务间调用认证 | `InternalApiSecretFilter` |
| 权限控制 | `@PreAuthorize("hasRole('ADMIN')")` | Controller 层 |

---

## 四、技术栈

| 类别 | 技术/框架 | 用途 |
|------|----------|------|
| Web 框架 | Spring Boot Web | REST API |
| 服务发现 | Nacos Discovery | 服务注册与发现 |
| RPC | Dubbo | 微服务间调用 |
| 数据库 | MySQL / PostgreSQL | 主数据库 |
| ORM | MyBatis | 数据访问 |
| 数据库迁移 | Flyway | 版本化数据库迁移 |
| 安全 | Spring Security | 认证授权、密码加密 |
| JWT | jjwt | Token 生成与验证 |
| 缓存 | Redis | Token 存储与轮换 |
| 邮件 | Resend Java SDK | 发送验证/重置邮件 |
| 定时任务 | Spring Scheduling | Token 清理 |
| 健康检查 | Spring Actuator | 服务健康监控 |
| 测试 | Testcontainers | 集成测试（自包含） |
| 代码质量 | JaCoCo | 代码覆盖率（要求 75%） |
| 安全扫描 | OWASP Dependency Check | 依赖漏洞扫描 |

---

## 五、API 端点

### 用户管理 API（`/api/users`）

- `GET /api/users` - 分页查询用户
- `GET /api/users/{id}` - 获取用户详情
- `POST /api/users` - 创建用户
- `PUT /api/users/{id}` - 更新用户
- `DELETE /api/users/{id}` - 软删除用户
- `POST /api/users/{id}/restore` - 恢复用户

### 角色管理 API（`/api/roles`）

- `GET /api/roles` - 分页查询角色
- `GET /api/roles/{id}` - 获取角色详情
- `POST /api/roles` - 创建角色
- `PUT /api/roles/{id}` - 更新角色
- `DELETE /api/roles/{id}` - 删除角色

### 权限管理 API（`/api/permissions`）

- `GET /api/permissions` - 查询权限列表
- `GET /api/permissions/user/{userId}` - 查询用户权限
- `GET /api/permissions/role/{roleId}` - 查询角色权限

### 用户偏好 API（`/api/users/me/locale`）

- `GET /api/users/me/locale` - 获取当前用户语言偏好
- `PUT /api/users/me/locale` - 更新当前用户语言偏好

---

## 六、设计特点

1. **分层架构**：Controller → Service → Mapper → Entity
2. **统一异常处理**：通过 `@ComponentScan` 引入 `GlobalExceptionHandler`
3. **软删除**：保留数据，支持恢复
4. **审计日志**：记录敏感操作
5. **安全**：JWT、密码加密、权限控制、内部 API 密钥保护
6. **数据库迁移**：Flyway 版本化管理
7. **多环境配置**：`application.yml`、`application-docker.yml`、`application-render.yml`
8. **测试**：Testcontainers 自包含测试

---

## 七、与其他服务的关系

```
┌─────────────┐
│ api-gateway │  ← 统一入口
└──────┬──────┘
       │
       ├──→ user-service (当前服务)
       │    ├── 用户管理
       │    ├── 角色权限管理
       │    └── 邮箱验证/密码重置
       │
       ├──→ auth-service
       │    └── 登录/注册（依赖 user-service）
       │
       └──→ chat-service
            └── 聊天服务（可能依赖 user-service 获取用户信息）
```

---

## 八、启动配置

### 主启动类

```java
@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现，注册到 Nacos
@EnableScheduling  // 启用定时任务（密码重置 Token 清理等）
@ComponentScan(basePackages = {"com.example.user", "com.example.api.exception"})  // 扫描全局异常处理器
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

### 关键配置说明

- **@ComponentScan**：扫描 `com.example.api.exception` 包，引入全局异常处理器 `GlobalExceptionHandler`
- **@EnableDiscoveryClient**：注册到 Nacos 服务注册中心
- **@EnableScheduling**：启用定时任务，用于清理过期的密码重置 Token

---

## 九、数据库迁移

使用 Flyway 进行数据库版本管理，迁移脚本位于 `src/main/resources/db/migration/`：

- `V1__create_users_table.sql` - 创建用户表
- `V2__add_password_to_users.sql` - 添加密码字段
- `V3__add_email_verification.sql` - 添加邮箱验证功能
- `V4__add_password_reset.sql` - 添加密码重置功能
- `V5__rbac_roles_permissions.sql` - 添加 RBAC 角色权限表
- `V6__audit_log.sql` - 添加审计日志表
- `V7__rbac_seed_data.sql` - 初始化角色权限数据

---

## 十、安全特性

1. **密码加密**：使用 Spring Security 的 `PasswordEncoder`（BCrypt）
2. **JWT 认证**：Token 生成、验证、刷新机制
3. **权限控制**：基于角色的访问控制（RBAC）
4. **内部 API 保护**：服务间调用使用密钥认证
5. **审计日志**：记录所有敏感操作（创建/更新/删除用户）
6. **密码策略**：密码强度校验
7. **Token 过期管理**：定时清理过期的密码重置 Token

---

## 十一、测试

- **单元测试**：使用 JUnit 5 + Mockito
- **集成测试**：使用 Testcontainers（自包含，无需手动启动 Redis）
- **代码覆盖率**：JaCoCo 要求整体覆盖率 ≥ 75%，关键服务类 ≥ 80%
- **安全扫描**：OWASP Dependency Check 扫描依赖漏洞

---

## 十二、部署

### Docker 部署

```bash
# 构建镜像
docker build -t user-service:latest .

# 运行容器
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/user_db \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=root123 \
  user-service:latest
```

### 环境配置

- **开发环境**：`application.yml`
- **Docker 环境**：`application-docker.yml`
- **Render 平台**：`application-render.yml`

---

## 十三、相关文档

- [性能测试文档](../README-PERFORMANCE-TEST.md)
- [安全扫描文档](../README-SECURITY-SCAN.md)
- [API 文档](../../api-common/docs/API.md)
- [内部 API 保护功能说明](./INTERNAL-API-SECURITY.md) - 详细说明内部 API 密钥认证机制
- [文档自动同步说明](./README-SYNC.md) - 代码修改时自动更新文档的说明

---

## 十四、总结

`user-service` 是用户管理核心服务，提供：
- ✅ 完整的用户 CRUD、分页、软删除功能
- ✅ RBAC（角色权限管理）
- ✅ 邮箱验证和密码重置
- ✅ 审计日志记录
- ✅ JWT 认证和权限控制
- ✅ 多环境支持和容器化部署

采用 Spring Boot + MyBatis + Nacos + Dubbo 技术栈，符合微服务架构最佳实践。
