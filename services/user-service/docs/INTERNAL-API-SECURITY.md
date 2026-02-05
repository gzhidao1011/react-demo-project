# 内部 API 保护功能说明

## 概述

`user-service` 实现了**内部 API 保护机制**，通过密钥认证保护服务间调用的内部 API，防止外部直接访问。

## 功能定位

- **保护路径**：所有以 `/internal/**` 开头的 API 端点
- **认证方式**：通过 `X-Internal-Secret` 请求头传递密钥
- **使用场景**：供 `auth-service` 等内部微服务调用
- **安全级别**：在 JWT 认证之前执行，优先级更高

---

## 实现位置

### 1. 核心过滤器：`InternalApiSecretFilter.java`

**位置**：`services/user-service/src/main/java/com/example/user/config/InternalApiSecretFilter.java`

**功能说明**：
- 拦截所有以 `/internal/` 开头的请求
- 检查请求头 `X-Internal-Secret` 是否与配置的密钥匹配
- 密钥不匹配时返回 403 Forbidden

**关键代码**：
```java
@Component
@Order(1)
public class InternalApiSecretFilter extends OncePerRequestFilter {
    private static final String INTERNAL_PATH_PREFIX = "/internal/";
    private static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";
    
    @Value("${internal.api.secret:}")
    private String expectedSecret;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) {
        String path = request.getRequestURI();
        
        // 只对 /internal/** 路径进行校验
        if (!path.startsWith(INTERNAL_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // 校验密钥
        String secret = request.getHeader(HEADER_INTERNAL_SECRET);
        if (expectedSecret.isEmpty() || !expectedSecret.equals(secret)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":403,\"message\":\"无权限访问内部 API\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

### 2. 内部 API 控制器：`InternalApiController.java`

**位置**：`services/user-service/src/main/java/com/example/user/controller/internal/InternalApiController.java`

**功能说明**：
- 所有 API 路径都以 `/internal` 开头
- 供 `auth-service` 等内部服务调用
- 包含用户校验、创建用户、获取角色等内部接口

**提供的内部 API**：

| API 端点 | 方法 | 说明 |
|---------|------|------|
| `/internal/auth/validate` | POST | 校验用户（登录时）：验证邮箱+密码，返回 userId、email、name、roles |
| `/internal/users` | POST | 创建用户（注册时）：user-service 哈希密码并入库 |
| `/internal/users/{id}/email-verified` | PATCH | 设置用户邮箱已验证 |
| `/internal/users/{id}/password` | PATCH | 更新密码（重置：仅 newPassword；修改：currentPassword + newPassword） |
| `/internal/users/by-email` | GET | 按邮箱查用户（供忘记密码等，存在则返回 userId、email） |
| `/internal/users/{id}` | GET | 获取用户信息（供 /me、refresh 等） |
| `/internal/users/{id}/roles` | GET | 获取用户角色列表（供 refresh Token 时拉取最新角色） |
| `/internal/email-verification/send` | POST | 发送邮箱验证邮件（供 auth-service 注册后调用） |
| `/internal/email-verification/resend` | POST | 重新发送邮箱验证邮件（供 auth-service resend-verification 调用） |
| `/internal/email-verification/verify` | POST | 验证邮箱 token，设置 email_verified，返回用户信息 |
| `/internal/password-reset/request` | POST | 请求密码重置（发邮件，用户枚举防护） |
| `/internal/password-reset/validate` | POST | 校验密码重置 token 并一次性消费，返回 userId |
| `/internal/users/{id}` | DELETE | 删除用户（内部 API，供 auth-service 注册失败时补偿使用） |

**关键代码**：
```java
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalApiController {
    
    /**
     * 校验用户（登录时）：验证邮箱+密码，返回 userId、email、name、roles
     */
    @PostMapping("/auth/validate")
    public ResponseEntity<InternalAuthValidateResponse> validateUser(
            @Valid @RequestBody InternalAuthValidateRequest request) {
        // ...
    }
    
    // 其他内部 API...
}
```

---

### 3. 安全配置：`SecurityConfig.java`

**位置**：`services/user-service/src/main/java/com/example/user/config/SecurityConfig.java`

**功能说明**：
- 将 `InternalApiSecretFilter` 添加到 Spring Security 过滤器链
- 在 JWT 认证之前执行（Order=1）
- `/internal/**` 路径跳过 JWT 认证，由密钥过滤器校验

**关键代码**：
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    private final InternalApiSecretFilter internalApiSecretFilter;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(AntPathRequestMatcher.antMatcher("/internal/**"))
                    .permitAll() // 内部 API 由 InternalApiSecretFilter 校验
                .requestMatchers(AntPathRequestMatcher.antMatcher("/actuator/health"))
                    .permitAll() // 健康检查公开访问
                .anyRequest().authenticated() // 其他接口需 JWT 认证
            )
            // 在 JWT 认证之前执行内部 API 密钥校验
            .addFilterBefore(internalApiSecretFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

---

### 4. 配置文件：`application.yml`

**位置**：`services/user-service/src/main/resources/application.yml`

**功能说明**：
- 配置内部 API 密钥
- 可通过环境变量 `INTERNAL_API_SECRET` 覆盖

**关键配置**：
```yaml
# 内部 API 密钥（供 auth-service 调用 /internal/** 时携带 X-Internal-Secret）
internal:
  api:
    secret: ${INTERNAL_API_SECRET:change-me-internal-secret}
```

---

## 使用场景

### 场景：auth-service 调用 user-service 的内部 API

当 `auth-service` 需要调用 `user-service` 的用户相关功能时：

#### 1. 请求示例

**校验用户（登录）**：
```http
POST http://user-service:8001/internal/auth/validate
Headers:
  X-Internal-Secret: change-me-internal-secret
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "userId": 1,
  "email": "user@example.com",
  "name": "User Name",
  "roles": ["USER"]
}
```

**创建用户（注册）**：
```http
POST http://user-service:8001/internal/users
Headers:
  X-Internal-Secret: change-me-internal-secret
  Content-Type: application/json

Body:
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}

Response: 201 Created
{
  "userId": 2
}
```

**获取用户信息**：
```http
GET http://user-service:8001/internal/users/1
Headers:
  X-Internal-Secret: change-me-internal-secret

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00"
}
```

#### 2. 执行流程

1. **请求到达** `InternalApiSecretFilter`
2. **路径检查**：检查路径是否为 `/internal/**` → 是
3. **密钥校验**：检查 `X-Internal-Secret` 头 → 与配置匹配
4. **放行**：请求继续到 `InternalApiController`
5. **执行业务逻辑**：处理请求并返回响应

#### 3. 密钥错误的情况

```http
POST http://user-service:8001/internal/auth/validate
Headers:
  X-Internal-Secret: wrong-secret
  Content-Type: application/json

Response: 403 Forbidden
{
  "code": 403,
  "message": "无权限访问内部 API"
}
```

---

## 功能特点

| 特点 | 说明 |
|------|------|
| **路径限制** | 只保护 `/internal/**` 路径 |
| **密钥认证** | 通过 `X-Internal-Secret` 请求头传递密钥 |
| **优先级高** | 在 JWT 认证之前执行（Order=1） |
| **配置灵活** | 支持环境变量配置，便于不同环境使用不同密钥 |
| **服务间调用** | 专为微服务间内部调用设计 |
| **简化调用** | 内部服务调用不需要 JWT Token |

---

## 配置说明

### 开发环境

在 `application.yml` 中配置默认密钥：
```yaml
internal:
  api:
    secret: change-me-internal-secret
```

### 生产环境

通过环境变量配置密钥：
```bash
export INTERNAL_API_SECRET=your-production-secret-key
```

或在 `docker-compose.yml` 中配置：
```yaml
services:
  user-service:
    environment:
      - INTERNAL_API_SECRET=your-production-secret-key
```

### 调用方配置

调用方（如 `auth-service`）需要在请求头中添加密钥：

**Java（RestTemplate）**：
```java
HttpHeaders headers = new HttpHeaders();
headers.set("X-Internal-Secret", "change-me-internal-secret");
HttpEntity<String> entity = new HttpEntity<>(body, headers);
restTemplate.postForObject(url, entity, Response.class);
```

**Java（WebClient）**：
```java
webClient.post()
    .uri("/internal/auth/validate")
    .header("X-Internal-Secret", "change-me-internal-secret")
    .bodyValue(request)
    .retrieve()
    .bodyToMono(Response.class);
```

---

## 安全建议

1. **使用强密钥**：生产环境使用随机生成的强密钥（至少 32 字符）
2. **定期轮换**：定期更换内部 API 密钥
3. **环境隔离**：不同环境使用不同的密钥
4. **密钥管理**：使用密钥管理服务（如 Vault、AWS Secrets Manager）存储密钥
5. **日志记录**：记录所有内部 API 调用，便于审计和排查问题

---

## 与其他认证方式的对比

| 认证方式 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|------|
| **内部 API 密钥** | 服务间调用 | 简单、快速、无需 Token | 密钥泄露风险 |
| **JWT Token** | 用户请求 | 无状态、可携带用户信息 | 需要 Token 管理 |
| **mTLS** | 高安全场景 | 双向认证、加密传输 | 配置复杂 |

---

## 故障排查

### 问题 1：返回 403 Forbidden

**可能原因**：
- 请求头 `X-Internal-Secret` 缺失或错误
- 配置的密钥与请求头中的密钥不匹配

**解决方案**：
1. 检查请求头是否包含 `X-Internal-Secret`
2. 检查配置的密钥是否正确
3. 检查环境变量 `INTERNAL_API_SECRET` 是否设置

### 问题 2：密钥为空

**可能原因**：
- 配置文件中 `internal.api.secret` 为空
- 环境变量未设置且没有默认值

**解决方案**：
1. 在 `application.yml` 中设置默认值
2. 或通过环境变量设置密钥

### 问题 3：过滤器未生效

**可能原因**：
- `SecurityConfig` 中未正确注册过滤器
- 过滤器顺序不正确

**解决方案**：
1. 检查 `SecurityConfig` 中是否添加了 `internalApiSecretFilter`
2. 检查过滤器顺序（应在 JWT 认证之前）

---

## 相关文档

- [README.md](./README.md) - 服务主文档
- [SecurityConfig.java](../src/main/java/com/example/user/config/SecurityConfig.java) - 安全配置源码
- [InternalApiSecretFilter.java](../src/main/java/com/example/user/config/InternalApiSecretFilter.java) - 过滤器源码
- [InternalApiController.java](../src/main/java/com/example/user/controller/internal/InternalApiController.java) - 内部 API 控制器源码

---

## 总结

内部 API 保护功能通过密钥认证机制，为微服务间的内部调用提供了简单而有效的安全保护。该功能：

- ✅ **简单易用**：只需在请求头中添加密钥即可
- ✅ **性能优秀**：在 JWT 认证之前执行，减少不必要的处理
- ✅ **配置灵活**：支持环境变量配置，便于不同环境使用
- ✅ **职责清晰**：与 JWT 认证分离，各司其职

通过合理配置和使用，可以有效保护内部 API 不被外部直接访问。
