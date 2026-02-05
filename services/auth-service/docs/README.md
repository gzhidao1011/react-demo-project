# Auth Service 认证服务

## 一、核心定位

`auth-service` 是微服务架构中的**认证与授权核心服务**，负责：
- ✅ 用户注册、登录、邮箱验证
- ✅ JWT Token 签发、刷新、轮换与撤销
- ✅ 密码重置与修改、密码策略验证
- ✅ 限流与防暴力攻击
- ✅ Token 重用检测与安全防护

---

## 二、目录结构

```
services/auth-service/
├── src/main/java/com/example/auth/
│   ├── AuthServiceApplication.java          # 主启动类
│   ├── config/                              # 配置类
│   │   ├── SecurityConfig.java              # Spring Security 配置
│   │   ├── JwtAuthFilter.java               # JWT 认证过滤器
│   │   └── RestTemplateConfig.java          # RestTemplate 配置
│   ├── controller/                          # REST API 控制器层
│   │   └── AuthController.java              # 认证相关 API
│   ├── service/                             # 业务逻辑层
│   │   ├── AuthService.java                 # 核心认证服务
│   │   ├── JwtService.java                  # JWT Token 管理
│   │   ├── TokenRotationService.java        # Token 轮换与撤销
│   │   ├── RateLimitService.java            # 限流服务
│   │   └── PasswordPolicyService.java       # 密码策略验证
│   ├── saga/                                # Saga 分布式事务
│   │   ├── RegistrationSaga.java            # 用户注册 Saga
│   │   ├── SagaOrchestrator.java            # Saga 编排器
│   │   ├── SagaContext.java                 # Saga 上下文
│   │   └── SagaStep.java                    # Saga 步骤
│   └── client/                              # 远程服务调用
│       ├── UserServiceInternalClient.java   # user-service 客户端
│       └── dto/                             # 请求/响应 DTO 集合
├── src/main/resources/
│   ├── application.yml                      # 主配置文件
│   ├── application-docker.yml               # Docker 环境配置
│   ├── application-render.yml               # Render 平台配置
│   └── keys/                                # JWT 密钥文件
│       ├── private.pem                      # RS256 私钥
│       └── public.pem                       # RS256 公钥
├── src/test/java/com/example/auth/
│   └── service/AuthServiceTest.java         # 单元测试
├── pom.xml                                  # Maven 依赖配置
├── Dockerfile                               # Docker 镜像构建
└── README.md                                # 服务文档
```

---

## 三、核心功能模块

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| **用户注册** | 邮箱+密码注册，Saga 分布式事务 | `RegistrationSaga`、`AuthService.register()` |
| **用户登录** | 邮箱验证+密码验证，签发 Access/Refresh Token | `AuthService.login()` |
| **邮箱验证** | 验证邮箱 Token，解锁登录权限 | `AuthService.verifyEmail()` |
| **密码重置** | 请求重置→发邮件→验证 Token→重置 | `AuthService.resetPassword()` |
| **密码修改** | 已登录用户修改密码 | `AuthService.changePassword()` |
| **Token 刷新** | 使用 Refresh Token 获取新 Access Token | `AuthService.refreshToken()` |
| **Token 轮换** | Refresh Token 一次性使用，旧 Token 加黑名单 | `TokenRotationService` |
| **重用检测** | 发现 Token 重用立即报错并拉黑所有 Token | `TokenRotationService.checkTokenReuse()` |
| **限流防护** | 登录、验证、重置等接口限流 | `RateLimitService` |
| **用户查询** | 获取当前登录用户信息 | `AuthService.getCurrentUser()` |
| **注册补偿** | 注册失败自动删除已创建用户 | `RegistrationSaga` 补偿逻辑 |

---

## 四、技术栈

| 类别 | 技术/框架 | 用途 |
|------|----------|------|
| Web 框架 | Spring Boot Web | REST API |
| 安全框架 | Spring Security | 认证授权、密码加密 |
| 服务发现 | Nacos Discovery | 服务注册与发现 |
| 服务调用 | RestTemplate + LoadBalancer | 调用 user-service |
| JSON Web Token | jjwt (io.jsonwebtoken) | RS256 Token 签发与验证 |
| 缓存/存储 | Redis | Token 存储与轮换、限流计数 |
| 邮件服务 | Resend Java SDK | 发送验证/重置邮件 |
| HTTP 客户端 | Apache HttpClient5 | RestTemplate 支持 PATCH 方法 |
| 口令加密 | BCrypt (Spring Security) | 密码加密与校验 |
| 参数校验 | Jakarta Bean Validation | 输入参数校验 |
| 健康检查 | Spring Actuator | 服务健康监控 |
| 日志 | SLF4J + Logback | 日志输出 |
| 测试 | JUnit5 + Mockito | 单元测试 |
| Lombok | Lombok | 代码生成 |

## 五、API 端点

### 认证接口（`/api/auth`）

| 端点 | 说明 | 权限要求 |
|------|------|----------|
| `POST /register` | 用户注册（邮箱+密码） | 公开 |
| `POST /login` | 用户登录 | 公开 |
| `POST /verify-email` | 邮箱验证 | 公开 |
| `POST /resend-verification` | 重新发送验证邮件 | 公开 |
| `POST /forgot-password` | 发起密码重置 | 公开 |
| `POST /reset-password` | 重置密码 | 公开 |
| `POST /refresh` | 刷新 Access Token | 公开 |
| `POST /logout` | 退出登录（拉黑 Refresh Token） | 公开 |
| `POST /change-password` | 修改密码 | ✅ 需 JWT |
| `GET /me` | 获取当前用户信息 | ✅ 需 JWT |

---

## 六、启动配置

### 主启动类

```java
@SpringBootApplication
@EnableDiscoveryClient  // 启用 Nacos 服务发现
@EnableScheduling       // 启用定时任务（未来扩展）
@ComponentScan(basePackages = {"com.example.auth", "com.example.api.exception"})
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
```

### 快速开始（本地）

**1. 准备依赖**
- Nacos（注册中心）：`localhost:8848`
- Redis：`localhost:6379`
- user-service 已启动

**2. 配置环境变量**
```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export NACOS_SERVER_ADDR=localhost:8848
export JWT_ISSUER=https://auth.example.com
export JWT_AUDIENCE=api.example.com
export INTERNAL_API_SECRET=your-internal-secret
export RESEND_API_KEY=your-resend-api-key
export RESEND_FROM=noreply@example.com
export APP_FRONTEND_URL=http://localhost:5173
```

**3. 启动服务**
```bash
mvn -pl services/auth-service -am spring-boot:run
```

**4. 验证启动成功**
```bash
curl http://localhost:8002/actuator/health
```

---

## 七、配置详解

### application.yml 主要配置项

```yaml
server:
  port: 8002

spring:
  application:
    name: auth-service
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
        namespace: ${NACOS_NAMESPACE:public}
        group: ${NACOS_GROUP:DEFAULT_GROUP}
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: 1  # 与 user-service 使用不同 db
  jackson:
    default-property-inclusion: non_null

# JWT 配置（RS256 非对称加密）
jwt:
  algorithm: RS256
  private-key-path: classpath:keys/private.pem   # 私钥（签发）
  public-key-path: classpath:keys/public.pem     # 公钥（验证）
  access-token-expiration: 1800      # 30 分钟
  refresh-token-expiration: 604800   # 7 天
  issuer: ${JWT_ISSUER:https://auth.example.com}
  audience: ${JWT_AUDIENCE:api.example.com}

# 密码策略配置
password:
  min-length: 8
  require-uppercase: true      # 必须有大写字母
  require-lowercase: true      # 必须有小写字母
  require-digit: true          # 必须有数字
  require-special: true        # 必须有特殊字符

# 邮件配置
resend:
  api-key: ${RESEND_API_KEY:}
  from: ${RESEND_FROM:}
  verification-link-base: ${APP_FRONTEND_URL:http://localhost:5173}

# 限流配置
rate-limit:
  login:
    max-attempts-per-ip: 100
    max-attempts-per-user: 5
    ip-window-seconds: 3600
    user-window-seconds: 900
  verify-email:
    max-attempts-per-ip: 10
    ip-window-seconds: 3600
  forgot-password:
    max-attempts-per-ip: 5
    max-attempts-per-email: 3
    ip-window-seconds: 3600
    email-window-seconds: 3600

# 调用 user-service 内部 API
user-service:
  internal:
    base-url: http://user-service
    secret: ${INTERNAL_API_SECRET:change-me-internal-secret}

# 健康检查
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

---

## 八、核心流程

### 注册流程（Saga 分布式事务）

```
用户提交注册
    ↓
密码策略验证
    ↓
Saga Step 1: 创建用户
    ↓
Saga Step 2: 发送验证邮件
    ↓
成功返回 → 若任何步骤失败 → 自动删除已创建用户（补偿）
```

### 登录与 Token 流程

```
用户输入邮箱+密码
    ↓
调用 user-service 校验邮箱+密码
    ↓
检查邮箱是否已验证
    ↓
生成 Access Token（30分钟）+ Refresh Token（7天）
    ↓
存储 Refresh Token 到 Redis
    ↓
返回 tokens + user info
```

### Token 轮换与安全

```
客户端使用 Refresh Token 刷新
    ↓
验证 Refresh Token 合法性
    ↓
检查是否已被使用过（重用检测）
    ↓
若发现重用 → 拉黑所有该用户的 Token → 拒绝请求
    ↓
否则 → 旧 Token 加入黑名单 → 签发新 Token
```

---

## 九、限流机制

| 场景 | IP 限制 | 用户/邮箱 限制 | 时间窗口 |
|------|--------|------------|---------|
| 登录 | 100 次/IP | 5 次/用户 | 60 分钟 / 15 分钟 |
| 验证邮箱 | 10 次/IP | — | 60 分钟 |
| 忘记密码 | 5 次/IP | 3 次/邮箱 | 60 分钟 |
| 重置密码 | 10 次/IP | — | 60 分钟 |

---

## 十、与其他服务的关系

```
┌─────────────┐
│ api-gateway │  ← 统一网关入口
└──────┬──────┘
       │
       ├──→ auth-service (当前服务)
       │    ├── 注册 → 调用 user-service
       │    ├── 登录 → 调用 user-service
       │    ├── Token 刷新
       │    └── 邮箱验证/密码重置
       │
       ├──→ user-service
       │    ├── 用户 CRUD
       │    ├── 邮箱验证
       │    └── 密码管理
       │
       └──→ chat-service（可选）
            └── 消息服务
```

---

## 十一、安全特性

| 特性 | 说明 | 实现 |
|------|------|------|
| **RSA 非对称加密** | 私钥签发、公钥验证，服务间可验证 Token | RS256 algorithm |
| **Token 轮换** | 每次刷新生成新 Token，旧 Token 立即失效 | `TokenRotationService` |
| **重用检测** | 发现 Token 被重用（如被截获），立即拉黑全部 | `checkTokenReuse()` |
| **密码策略** | 大小写+数字+特殊符号，长度≥8 | `PasswordPolicyService` |
| **限流防护** | 防止暴力破解 | `RateLimitService` |
| **邮箱验证** | 必须验证邮箱才能登录 | `EMAIL_NOT_VERIFIED` 错误码 |
| **内部 API 保护** | service-to-service 调用验证密钥 | `X-Internal-Secret` 请求头 |
| **用户枚举防护** | 忘记密码统一提示，不泄露用户是否存在 | `ForgotPasswordResponse` |

---

## 十二、错误码说明

| 错误码 | HTTP 状态 | 含义 |
|--------|----------|------|
| 40100 | 401 | 邮箱或密码错误 |
| 40103 | 401 | Token 已过期 |
| 40104 | 401 | 无效的 Token |
| 40105 | 401 | 无效的 Refresh Token |
| 40106 | 401 | 检测到 Token 重用（安全防护） |
| 40109 | 401 | 邮箱未验证 |
| 40110 | 401 | 重置链接无效或已过期 |
| 40001 | 400 | 邮箱已被注册 |
| 40002 | 400 | 密码强度不足 |
| 40003 | 400 | 密码不符合策略要求 |
| 40004 | 400 | 参数校验失败 |
| 42901 | 429 | 请求过于频繁（限流） |
| 90002 | 500 | 远程服务（user-service）调用失败 |

---

## 十三、部署

### Docker 部署

**编译镜像**
```bash
docker build -t auth-service:latest .
```

**运行容器**
```bash
docker run -d \
  --name auth-service \
  -p 8002:8002 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e NACOS_SERVER_ADDR=nacos:8848 \
  -e INTERNAL_API_SECRET=your-secret \
  -e RESEND_API_KEY=your-api-key \
  auth-service:latest
```

**Docker Compose（推荐）**
```bash
docker-compose up -d auth-service
```

### Render 平台部署

1. 设置 `SPRING_PROFILES_ACTIVE=render`
2. 配置环境变量（Render 仪表板）
3. 自动部署

### 生产建议

- ✅ 启用最小权限访问控制（RBAC）
- ✅ 密钥外置管理（不提交仓库）
- ✅ 启用日志脱敏（不输出敏感信息）
- ✅ 配置告警（注册失败、Token 重用、限流触发）
- ✅ 定期轮换 RSA 密钥
- ✅ 启用 HTTPS（TLS 1.2+）

---

## 十四、常见问题

### Q: 为什么使用 Saga 模式进行注册？
**A：** 注册涉及两个步骤（创建用户 + 发送邮件），分布在不同系统。Saga 模式保证一致性：若发邮件失败，自动删除已创建的用户，避免脏数据。

### Q: Refresh Token 如何防止被盗用？
**A：** 使用 Token 轮换机制：
- 每次刷新都生成新 Token，旧 Token 立即失效
- 若旧 Token 被尝试使用，说明被盗用，系统自动拉黑该用户所有 Token，强制重新登录

### Q: 为什么邮箱验证前不能登录？
**A：** 安全策略。防止恶意注册者使用他人邮箱，邮箱验证确保拥有者身份。

### Q: Token 过期后怎么办？
**A：** 使用 Refresh Token 重新获取 Access Token（无需重新登录）。若 Refresh Token 也过期，需重新登录。

### Q: 限流是如何работает？
**A：** Redis 计数器 + TTL 时间窗口：
```
登录失败 → Redis key: rate_limit:login:ip:192.168.1.1 增加 1
└→ 若 1 小时内超过 100 次，返回 429 Too Many Requests
└→ 1 小时后自动重置
```

---

```bash
curl -X POST http://localhost:8002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

**登录**
```bash
curl -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

**邮箱验证**
```bash
curl -X POST http://localhost:8002/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification-token-from-email"}'
```

**获取当前用户**
```bash
curl -X GET http://localhost:8002/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**刷新 Token**
```bash
curl -X POST http://localhost:8002/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "refresh-token-from-login"}'
```

---

## 十六、相关文档

- [API 分析文档](./auth-service-analysis.md) - 详细的技术分析
- [用户服务文档](../../user-service/docs/README.md) - user-service 服务说明
- [API 公共模块](../../api-common/docs/) - 错误码、响应格式定义

---

## 十七、总结

`auth-service` 是微服务架构中的认证核心，采用：
- ✅ **JWT + RS256** - 安全的 Token 签发与验证
- ✅ **Token 轮换** - 防止 Token 盗用
- ✅ **Saga 分布式事务** - 保证注册一致性
- ✅ **多层限流** - 防暴力破解
- ✅ **邮箱验证** - 身份确认
- ✅ **密码策略** - 强度要求

与 user-service、Redis、Nacos 紧密协作，完整实现了现代化微服务认证系统。

