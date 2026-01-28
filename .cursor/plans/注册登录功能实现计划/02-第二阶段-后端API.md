# 第二阶段：后端 API（认证接口）

**预计时间**：4-6 天

**前置依赖**：第一阶段（后端基础）

**目标**：实现注册和登录接口，包括密码策略验证、错误码定义和认证控制器。

---

## 与国外主流标准对照

本阶段设计对齐以下国际惯例，便于与第三方集成和合规审计：

| 领域 | 参考标准/实践 | 本项目做法 |
|------|----------------|------------|
| **Token 响应** | OAuth 2.0 RFC 6749 §5.1、RFC 6750 | `access_token`、`token_type`、`expires_in`、`refresh_token`、`scope`，JSON 使用 snake_case；Token 接口需返回 `Cache-Control: no-store`（见 2.3.5） |
| **错误码划分** | OAuth 2.0 错误码、GitHub/Stripe 风格 | 401xx 认证、400xx 验证、429xx 限流；与现有 `ResultCode` 合并时避免 code 重复（见 2.2.1） |
| **密码策略** | NIST SP 800-63-4、OWASP Authentication Cheat Sheet | 以长度为基础、可配置复杂度；NIST 新指南更强调长度与禁止常见密码，复杂度为可选项（见 2.1） |
| **认证安全** | OWASP、Auth0 Token Rotation | 登录失败统一提示「邮箱或密码错误」；Refresh Token 轮换与重用检测在第三阶段 |
| **错误响应** | 项目统一 `Result` 封装 | 不强制 RFC 7807；若需与 Problem Details 互操作，可在网关或单独端点做转换 |

**说明**：

- **API 路径**：当前实现为 `/api/auth`（见 `AuthController`、`SecurityConfig`）。若采用 `/api/v1/auth`，须在安全与网关中同步配置 `/api/v1/auth/**`。下文示例与完成清单中的路径可按项目实际二选一。
- **HTTP 状态码**：建议认证失败返回 `401 Unauthorized`、限流返回 `429 Too Many Requests`；可在 `GlobalExceptionHandler` 中按 `ResultCode` 映射，与业务码共同使用。

---

## 2.1 密码策略服务

### 步骤 2.1.1：创建 PasswordPolicyService

**文件**：`services/user-service/src/main/java/com/example/user/service/PasswordPolicyService.java`（新建）

**操作**：
- 创建文件
- 实现 `validatePassword()` 方法：
  - 检查长度（最少 8 个字符）
  - 检查是否包含大写字母
  - 检查是否包含小写字母
  - 检查是否包含数字
  - 检查是否包含特殊字符
- 返回验证结果和错误消息

**与 NIST/OWASP 的对照**：NIST SP 800-63-4 更强调密码长度和禁止常见密码，不再推荐强制「大写+小写+数字+符号」的复杂度。OWASP 建议最短长度（无 MFA 时建议≥15）、支持至少 64 字符以兼容 passphrase。本处策略采用可配置的复杂度（`require-uppercase` 等），既可满足传统合规，也可在配置中关闭部分规则以贴近 NIST 新指南；可选增强包括「常见密码/breach 检查」和「最大长度≥64」。

**伪代码示例**：

```java
package com.example.user.service;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 密码策略验证服务
 * 符合 NIST 和 OWASP 密码策略建议（可配置复杂度，见上文与 NIST/OWASP 的对照）
 */
@Service
public class PasswordPolicyService {

    @Value("${password.min-length:8}")
    private int minLength;

    @Value("${password.require-uppercase:true}")
    private boolean requireUppercase;

    @Value("${password.require-lowercase:true}")
    private boolean requireLowercase;

    @Value("${password.require-digit:true}")
    private boolean requireDigit;

    @Value("${password.require-special:true}")
    private boolean requireSpecial;

    // 正则表达式模式
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    /**
     * 验证密码是否符合策略
     *
     * @param password 待验证的密码
     * @return 验证结果，包含是否通过和错误消息列表
     */
    public PasswordValidationResult validatePassword(String password) {
        List<String> errors = new ArrayList<>();

        // 检查长度
        if (password == null || password.length() < minLength) {
            errors.add(String.format("密码长度至少需要 %d 个字符", minLength));
        }

        // 检查大写字母
        if (requireUppercase && !UPPERCASE_PATTERN.matcher(password).find()) {
            errors.add("密码必须包含至少一个大写字母");
        }

        // 检查小写字母
        if (requireLowercase && !LOWERCASE_PATTERN.matcher(password).find()) {
            errors.add("密码必须包含至少一个小写字母");
        }

        // 检查数字
        if (requireDigit && !DIGIT_PATTERN.matcher(password).find()) {
            errors.add("密码必须包含至少一个数字");
        }

        // 检查特殊字符
        if (requireSpecial && !SPECIAL_PATTERN.matcher(password).find()) {
            errors.add("密码必须包含至少一个特殊字符（!@#$%^&*等）");
        }

        boolean isValid = errors.isEmpty();
        String errorMessage = isValid ? null : String.join("；", errors);

        return new PasswordValidationResult(isValid, errorMessage, errors);
    }

    /**
     * 密码验证结果
     */
    @Data
    public static class PasswordValidationResult {
        private final boolean valid;
        private final String errorMessage;
        private final List<String> errors;

        public PasswordValidationResult(boolean valid, String errorMessage, List<String> errors) {
            this.valid = valid;
            this.errorMessage = errorMessage;
            this.errors = errors;
        }
    }
}
```

**单元测试伪代码**：

```java
@SpringBootTest
class PasswordPolicyServiceTest {
    @Autowired
    private PasswordPolicyService passwordPolicyService;

    @Test
    void testValidPassword() {
        String password = "Password123!";
        PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertTrue(result.isValid());
        assertNull(result.getErrorMessage());
    }

    @Test
    void testWeakPassword() {
        String password = "weak"; // 太短，缺少大写、数字、特殊字符
        PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 0);
    }
}
```

**验收标准**：
- ✅ 密码策略验证功能正常
- ✅ 单元测试通过
- ✅ 错误消息清晰

---

### 步骤 2.1.2：配置密码策略

**文件**：`services/user-service/src/main/resources/application.yml`

**操作**：
- 打开文件
- 添加密码策略配置

**配置示例**：

```yaml
password:
  min-length: 8
  require-uppercase: true
  require-lowercase: true
  require-digit: true
  require-special: true
```

**验收标准**：
- ✅ 配置加载成功

---

## 2.2 错误码定义

### 步骤 2.2.1：添加认证错误码

**文件**：`services/api-common/src/main/java/com/example/api/common/ResultCode.java`

**操作**：
- 打开文件
- 添加错误码枚举

**与现有 ResultCode 合并说明**：若枚举中已有 `UNAUTHORIZED(40100)` 等，需避免 code 重复（同一 code 只能对应一个枚举项）。可将「未授权」与「凭证错误」共用 40100，或保留其一并为其它的认证失败预留 40101、40102 等。限流码 `RATE_LIMIT_EXCEEDED(42901)` 的实现在第四阶段，本阶段仅做枚举预留即可。

**伪代码示例**：

```java
package com.example.api.common;

/**
 * 统一错误码枚举
 * 遵循 OAuth 2.0 错误码规范（401xx、400xx、429xx）
 */
public enum ResultCode {

    // ... 现有错误码 ...

    // ==================== 认证错误（401xx）====================

    /**
     * 邮箱或密码错误
     * 不明确提示是邮箱还是密码错误，防止用户枚举攻击
     */
    INVALID_CREDENTIALS(40100, "邮箱或密码错误"),

    /**
     * 邮箱不存在
     */
    EMAIL_NOT_FOUND(40101, "邮箱不存在"),

    /**
     * 密码错误
     */
    PASSWORD_ERROR(40102, "密码错误"),

    /**
     * Token 已过期
     */
    TOKEN_EXPIRED(40103, "Token 已过期"),

    /**
     * 无效的 Token
     */
    TOKEN_INVALID(40104, "无效的 Token"),

    /**
     * 无效的 Refresh Token
     */
    REFRESH_TOKEN_INVALID(40105, "无效的 Refresh Token"),

    /**
     * 检测到 Token 重用，请重新登录
     * Token 轮换安全检测，参考 Auth0 Refresh Token Rotation
     */
    REFRESH_TOKEN_REUSED(40106, "检测到 Token 重用，请重新登录"),

    /**
     * 账户已被锁定，请稍后再试
     * 登录失败次数过多
     */
    ACCOUNT_LOCKED(40107, "账户已被锁定，请稍后再试"),

    // ==================== 验证错误（400xx）====================

    /**
     * 邮箱已被注册
     */
    EMAIL_ALREADY_EXISTS(40001, "邮箱已被注册"),

    /**
     * 密码强度不足
     */
    PASSWORD_TOO_WEAK(40002, "密码强度不足"),

    /**
     * 密码不符合策略要求
     * 符合 NIST 和 OWASP 密码策略建议
     */
    PASSWORD_POLICY_VIOLATION(40003, "密码不符合策略要求"),

    // ==================== 限流错误（429xx）====================

    /**
     * 请求过于频繁，请稍后再试
     * 参考 GitHub、Stripe 的限流错误处理
     */
    RATE_LIMIT_EXCEEDED(42901, "请求过于频繁，请稍后再试");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
```

**验收标准**：
- ✅ 错误码定义完整
- ✅ 符合 OAuth 2.0 规范

---

## 2.3 认证控制器实现

### 步骤 2.3.1：创建 AuthController 基础结构

**文件**：`services/user-service/src/main/java/com/example/user/controller/AuthController.java`（新建）

**操作**：
- 创建文件
- 添加 `@RestController`、`@RequestMapping("/api/v1/auth")` 或与项目一致采用 `@RequestMapping("/api/auth")` 注解
- 注入依赖：UserService、PasswordEncoder、JwtService、PasswordPolicyService，或通过 **AuthService** 门面封装

**伪代码示例**：

```java
package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.api.model.*;
import com.example.user.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 遵循 OAuth 2.0 标准，实现注册、登录、Token 刷新、登出等功能
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordPolicyService passwordPolicyService;

    // 接口实现见后续步骤
}
```

**验收标准**：
- ✅ 控制器类创建成功
- ✅ 依赖注入正常

---

### 步骤 2.3.2：实现注册接口

**操作**：
- 实现 `POST /api/v1/auth/register` 方法
- 验证请求参数（使用 `@Valid`）
- 验证邮箱唯一性
- 验证密码策略
- 密码加密存储（BCrypt）
- 生成 JWT Token
- 返回 LoginResponse
- 添加单元测试

**伪代码示例**：

```java
/**
 * 用户注册接口
 *
 * @param request 注册请求（邮箱、密码）
 * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
 */
@PostMapping("/register")
public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
    // 1. 验证邮箱唯一性
    if (userService.existsByEmail(request.getEmail())) {
        return Result.error(ResultCode.EMAIL_ALREADY_EXISTS);
    }

    // 2. 验证密码策略
    PasswordPolicyService.PasswordValidationResult validationResult =
        passwordPolicyService.validatePassword(request.getPassword());
    if (!validationResult.isValid()) {
        return Result.error(ResultCode.PASSWORD_POLICY_VIOLATION, validationResult.getErrorMessage());
    }

    // 3. 创建用户
    UserEntity user = new UserEntity();
    user.setEmail(request.getEmail());
    // 密码加密存储
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setEmailVerified(false);

    UserEntity savedUser = userService.save(user);

    // 4. 生成 JWT Token
    String accessToken = jwtService.generateAccessToken(
        savedUser.getId().toString(),
        savedUser.getUsername(),
        savedUser.getRoles()
    );
    String refreshToken = jwtService.generateRefreshToken(
        savedUser.getId().toString(),
        null // 设备ID，后续添加设备管理时使用
    );

    // 5. 构建响应（遵循 OAuth 2.0 格式）
    LoginResponse response = LoginResponse.builder()
        .accessToken(accessToken)
        .tokenType("Bearer")
        .expiresIn(1800L) // 30 分钟
        .refreshToken(refreshToken)
        .scope("read write")
        .user(LoginResponse.UserInfo.builder()
            .id(savedUser.getId().toString())
            .email(savedUser.getEmail())
            .username(savedUser.getUsername())
            .emailVerified(savedUser.getEmailVerified())
            .build())
        .build();

    return Result.success(response);
}
```

**验收标准**：
- ✅ 注册接口功能正常
- ✅ 测试通过

---

### 步骤 2.3.3：实现登录接口

**操作**：
- 实现 `POST /api/v1/auth/login` 方法
- 验证邮箱和密码
- 密码校验（BCrypt）
- 根据 rememberMe 设置 Token 有效期
- 生成 JWT Token
- 返回 LoginResponse
- 添加单元测试

**伪代码示例**：

```java
/**
 * 用户登录接口
 * 遵循 OAuth 2.0 Password Grant 模式
 *
 * @param request 登录请求（邮箱、密码、记住我）
 * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
 */
@PostMapping("/login")
public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    // 1. 查找用户
    UserEntity user = userService.findByEmail(request.getEmail())
        .orElseThrow(() -> new BusinessException(ResultCode.INVALID_CREDENTIALS));

    // 2. 验证密码（不明确提示是邮箱还是密码错误，防止用户枚举攻击）
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
    }

    // 3. 根据 rememberMe 设置 Token 有效期
    long accessTokenExpiration = request.getRememberMe() ? 7776000L : 1800L; // 90 天或 30 分钟
    long refreshTokenExpiration = request.getRememberMe() ? 7776000L : 604800L; // 90 天或 7 天

    // 4. 生成 JWT Token
    String accessToken = jwtService.generateAccessToken(
        user.getId().toString(),
        user.getUsername(),
        user.getRoles()
    );
    String refreshToken = jwtService.generateRefreshToken(
        user.getId().toString(),
        null // 设备ID，后续添加设备管理时使用
    );

    // 5. 构建响应（遵循 OAuth 2.0 格式）
    LoginResponse response = LoginResponse.builder()
        .accessToken(accessToken)
        .tokenType("Bearer")
        .expiresIn(accessTokenExpiration)
        .refreshToken(refreshToken)
        .scope("read write")
        .user(LoginResponse.UserInfo.builder()
            .id(user.getId().toString())
            .email(user.getEmail())
            .username(user.getUsername())
            .emailVerified(user.getEmailVerified())
            .build())
        .build();

    return Result.success(response);
}
```

**验收标准**：
- ✅ 登录接口功能正常
- ✅ 测试通过
- ✅ "记住我"功能正常

---

### 步骤 2.3.4：接口测试

**操作**：
- 使用 Postman/curl 测试注册接口
- 使用 Postman/curl 测试登录接口
- 验证响应格式符合 OAuth 2.0
- 验证错误处理正确

**测试用例**：

**注册接口测试**：

```bash
# 测试注册接口
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'

# 预期响应（成功）：
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2gg...",
    "scope": "read write",
    "user": {
      "id": "123",
      "email": "test@example.com",
      "username": "testuser",
      "emailVerified": false
    }
  }
}

# 测试弱密码（预期失败）：
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "weak"
  }'

# 预期响应（失败）：
{
  "code": 40003,
  "message": "密码不符合策略要求：密码长度至少需要 8 个字符；密码必须包含至少一个大写字母；密码必须包含至少一个数字；密码必须包含至少一个特殊字符",
  "data": null
}
```

**登录接口测试**：

```bash
# 测试登录接口
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "rememberMe": false
  }'

# 测试"记住我"功能
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "rememberMe": true
  }'

# 测试错误密码（预期失败）
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'

# 预期响应（失败）：
{
  "code": 40100,
  "message": "邮箱或密码错误",
  "data": null
}
```

**验收标准**：
- ✅ 接口测试通过
- ✅ 响应格式正确
- ✅ 错误处理正确

**测试用例执行方式**：

1. **自动化测试（推荐）**：在仓库根目录或 `services` 下执行  
   ```bash
   cd services && mvn test -pl user-service -am
   ```  
   或仅跑本阶段相关用例：  
   ```bash
   cd services/user-service && mvn test "-Dtest=PasswordPolicyServiceTest,AuthControllerTest"
   ```  
   覆盖：密码策略、注册成功/邮箱已存在/弱密码、登录成功/错误密码/不存在邮箱、刷新/登出、以及响应头 `Cache-Control: no-store`。

2. **curl 接口测试**：需先启动 user-service（默认端口 8001，路径 `/api/auth`）。  
   脚本见同目录 `02-第二阶段-curl测试.sh`，使用方式：  
   ```bash
   # Linux/macOS 或 Git Bash
   chmod +x 02-第二阶段-curl测试.sh && ./02-第二阶段-curl测试.sh
   # 或指定地址： BASE_URL=http://localhost:8001/api/auth ./02-第二阶段-curl测试.sh
   ```  
   计划中示例使用 `http://localhost:8080/api/v1/auth`，当前项目为 `http://localhost:8001/api/auth`，以实际为准。

---

### 步骤 2.3.5：认证接口响应头（符合 RFC 6749）

**目的**：满足 OAuth 2.0 对 Token 响应的安全要求，防止客户端或中间层缓存 Token。

**操作**：对返回 Token 的接口（`/register`、`/login`，以及第三阶段的 `/refresh`），在响应中增加头：

- `Cache-Control: no-store`
- （可选）`Pragma: no-cache`

**实现方式**：在 `AuthController` 的对应方法上使用 `ResponseEntity` 并设置上述头，或在过滤器/拦截器中针对 `/api/auth/register`、`/api/auth/login`、`/api/auth/refresh` 的响应统一添加上述头。

**验收标准**：使用 curl/Postman 查看注册、登录接口的响应头，包含 `Cache-Control: no-store`。

---

## 阶段总结

### 完成清单

- [x] 步骤 2.1.1：创建 PasswordPolicyService（已存在，已补充单元测试 PasswordPolicyServiceTest）
- [x] 步骤 2.1.2：配置密码策略（已存在于 application.yml）
- [x] 步骤 2.2.1：添加认证错误码（已按 OAuth 2.0 规范整合 401xx/400xx/429xx，并消除重复码）
- [x] 步骤 2.3.1：创建 AuthController 基础结构（已存在）
- [x] 步骤 2.3.2：实现注册接口（已由 AuthService 实现）
- [x] 步骤 2.3.3：实现登录接口（已由 AuthService 实现）
- [x] 步骤 2.3.4：接口测试（AuthControllerTest 已覆盖注册/登录/刷新/登出及错误码）
- [x] **步骤 2.3.5：认证接口响应头（Cache-Control: no-store）**（register/login/refresh 已返回相应头，测试已断言）

### 下一步

完成第二阶段后，可以开始 **[第三阶段：Token 刷新机制](./03-第三阶段-Token刷新机制.md)**
