package com.example.user.controller;

import com.example.api.model.ForgotPasswordRequest;
import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RefreshTokenRequest;
import com.example.api.model.ResendVerificationRequest;
import com.example.api.model.ResetPasswordRequest;
import com.example.api.model.VerifyEmailRequest;
import com.example.user.mapper.UserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 集成测试（使用 Testcontainers 自包含 Redis）
 *
 * 测试覆盖：
 * - 注册接口（成功、邮箱已存在、密码策略验证）
 * - 登录接口（成功、错误密码、不存在的邮箱）
 * - 刷新 Token 接口（成功、无效 Token、过期 Token）
 * - 登出接口
 *
 * 无需手动启动 Redis，Testcontainers 会在测试时自动启动 Redis 容器
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Testcontainers
@TestPropertySource(properties = {
    // 禁用 Nacos 自动配置
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    // 禁用 Dubbo 自动配置（使用随机端口避免多测试并行时端口冲突）
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A",
    "dubbo.protocol.port=-1",
    // JWT 配置
    "jwt.algorithm=RS256",
    "jwt.private-key-path=classpath:keys/private.pem",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.access-token-expiration=1800",
    "jwt.refresh-token-expiration=604800",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com",
    // Redis host/port 由 @DynamicPropertySource 动态注入
    "spring.data.redis.password=",
    "spring.data.redis.database=15",
    "spring.data.redis.timeout=2000",
    // 数据库配置（使用 H2 内存数据库）
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false",
    "spring.sql.init.mode=always",
    // Resend 配置（测试环境不发送真实邮件）
    "resend.api-key=",
    "resend.from=onboarding@resend.dev",
    "resend.verification-link-base=http://localhost:5573",
    // 验证接口限流（测试用较大值）
    "rate-limit.verify-email.max-attempts-per-ip=20",
    "rate-limit.verify-email.ip-window-seconds=3600",
    // 密码重置限流（测试用较大值）
    "rate-limit.forgot-password.max-attempts-per-ip=20",
    "rate-limit.forgot-password.max-attempts-per-email=10",
    "rate-limit.forgot-password.ip-window-seconds=3600",
    "rate-limit.forgot-password.email-window-seconds=3600",
    "rate-limit.reset-password.max-attempts-per-ip=20",
    "rate-limit.reset-password.ip-window-seconds=3600",
    // 密码重置 Token 有效期
    "password-reset.token-expiry-minutes=60"
})
class AuthControllerTest {

    @Container
    static GenericContainer<?> redis =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> String.valueOf(redis.getFirstMappedPort()));
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    @Qualifier("stringRedisTemplate")
    private RedisTemplate<String, String> redisTemplate;

    /**
     * 测试辅助：获取注册后生成的验证 token（测试环境 RESEND_API_KEY 为空时，token 会存入 TestTokenStore）
     */
    private String createAndGetVerificationTokenForUser(String email) {
        return com.example.user.service.TestTokenStore.getToken(email);
    }

    /**
     * 测试辅助：获取忘记密码后生成的重置 token（测试环境 RESEND_API_KEY 为空时，token 会存入 TestTokenStore）
     */
    private String createAndGetPasswordResetTokenForUser(String email) {
        return com.example.user.service.TestTokenStore.getPasswordResetToken(email);
    }

    @BeforeEach
    void setUp() {
        userMapper.deleteAll();
        com.example.user.service.TestTokenStore.clear();
        // 清理 Redis 测试数据（与 TokenRotationService 使用相同 key 前缀）
        try {
            var refreshKeys = redisTemplate.keys("refresh_token:*");
            if (refreshKeys != null && !refreshKeys.isEmpty()) {
                redisTemplate.delete(refreshKeys);
            }
            var blacklistKeys = redisTemplate.keys("blacklist:*");
            if (blacklistKeys != null && !blacklistKeys.isEmpty()) {
                redisTemplate.delete(blacklistKeys);
            }
            var verifyRateLimitKeys = redisTemplate.keys("rate_limit:verify_email:*");
            if (verifyRateLimitKeys != null && !verifyRateLimitKeys.isEmpty()) {
                redisTemplate.delete(verifyRateLimitKeys);
            }
            var forgotPasswordKeys = redisTemplate.keys("rate_limit:forgot_password:*");
            if (forgotPasswordKeys != null && !forgotPasswordKeys.isEmpty()) {
                redisTemplate.delete(forgotPasswordKeys);
            }
            var resetPasswordKeys = redisTemplate.keys("rate_limit:reset_password:*");
            if (resetPasswordKeys != null && !resetPasswordKeys.isEmpty()) {
                redisTemplate.delete(resetPasswordKeys);
            }
        } catch (Exception ignored) {
            // Redis 连接异常由 Spring 上下文加载阶段暴露
        }
    }

    @Test
    void shouldRegisterSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.message").exists())
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.access_token").doesNotExist());
    }

    @Test
    void shouldFailWhenEmailAlreadyExists() throws Exception {
        // 先注册一个用户
        RegisterRequest firstRequest = new RegisterRequest();
        firstRequest.setEmail("test@example.com");
        firstRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isOk());

        // 尝试用相同邮箱注册
        RegisterRequest secondRequest = new RegisterRequest();
        secondRequest.setEmail("test@example.com");
        secondRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40001)); // EMAIL_ALREADY_EXISTS
    }

    @Test
    void shouldFailWhenPasswordTooWeak() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123"); // 密码太弱（长度够但缺少大写字母和特殊字符）

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40003)); // PASSWORD_POLICY_VIOLATION
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        // 先注册并验证邮箱，再登录
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // 获取验证 token（测试环境：从 EmailVerificationTokenMapper 查询后构造请求）
        String token = createAndGetVerificationTokenForUser("test@example.com");
        VerifyEmailRequest verifyRequest = new VerifyEmailRequest();
        verifyRequest.setToken(token);
        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.access_token").exists());

        // 登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.access_token").exists())
                .andExpect(jsonPath("$.data.token_type").value("Bearer"))
                .andExpect(jsonPath("$.data.refresh_token").exists())
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.user.email_verified").value(true));
    }

    @Test
    void shouldLoginFailWhenEmailNotVerified() throws Exception {
        // 注册后不验证，直接登录应失败
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40109)); // EMAIL_NOT_VERIFIED
    }

    @Test
    void shouldFailWhenPasswordIncorrect() throws Exception {
        // 先注册一个用户
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // 使用错误密码登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("WrongPassword123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40100)); // INVALID_CREDENTIALS
    }

    @Test
    void shouldFailWhenEmailNotFound() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40100)); // INVALID_CREDENTIALS
    }

    @Test
    void shouldVerifyEmailSuccessfully() throws Exception {
        // 注册
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("verify@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // 获取验证 token（测试环境会存入 TestTokenStore）
        String token = createAndGetVerificationTokenForUser("verify@example.com");
        assert token != null : "测试环境应能获取验证 token";

        VerifyEmailRequest verifyRequest = new VerifyEmailRequest();
        verifyRequest.setToken(token);

        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.access_token").exists())
                .andExpect(jsonPath("$.data.token_type").value("Bearer"))
                .andExpect(jsonPath("$.data.refresh_token").exists())
                .andExpect(jsonPath("$.data.user.email").value("verify@example.com"))
                .andExpect(jsonPath("$.data.user.email_verified").value(true));
    }

    @Test
    void shouldVerifyEmailFailWhenTokenInvalid() throws Exception {
        VerifyEmailRequest verifyRequest = new VerifyEmailRequest();
        verifyRequest.setToken("invalid-token-12345");

        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40104)); // TOKEN_INVALID
    }

    @Test
    void shouldResendVerificationReturn200ForExistingEmail() throws Exception {
        // 先注册
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("resend@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        ResendVerificationRequest resendRequest = new ResendVerificationRequest();
        resendRequest.setEmail("resend@example.com");

        mockMvc.perform(post("/api/auth/resend-verification")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resendRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldResendVerificationReturn200ForNonExistingEmail() throws Exception {
        // 用户枚举防护：不存在的邮箱也返回 200 + 相同成功消息
        ResendVerificationRequest resendRequest = new ResendVerificationRequest();
        resendRequest.setEmail("nonexistent@example.com");

        mockMvc.perform(post("/api/auth/resend-verification")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resendRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldRefreshTokenSuccessfully() throws Exception {
        // 先注册、验证邮箱，获取 refresh token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("refresh@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String token = createAndGetVerificationTokenForUser("refresh@example.com");
        assert token != null : "测试环境应能获取验证 token";

        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(token);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken(loginResponse.getRefreshToken());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.access_token").exists())
                .andExpect(jsonPath("$.data.refresh_token").exists());
    }

    @Test
    void shouldFailWhenRefreshTokenInvalid() throws Exception {
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken("invalid.token.here");

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40105)); // REFRESH_TOKEN_INVALID
    }
    
    @Test
    void shouldLogoutSuccessfully() throws Exception {
        // 先注册、验证邮箱，获取 refresh token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("logout@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String token = createAndGetVerificationTokenForUser("logout@example.com");
        assert token != null : "测试环境应能获取验证 token";

        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(token);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );

        RefreshTokenRequest logoutRequest = new RefreshTokenRequest();
        logoutRequest.setRefreshToken(loginResponse.getRefreshToken());

        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value(0));

        // 验证登出后无法使用相同的 refresh token
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40106)); // REFRESH_TOKEN_REUSED
    }

    // ==================== 密码重置测试 ====================

    @Test
    void shouldForgotPasswordReturn200ForExistingEmail() throws Exception {
        // 先注册并验证邮箱
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("forgot@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("forgot@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("forgot@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.message").exists());
    }

    @Test
    void shouldForgotPasswordReturn200ForNonExistingEmail() throws Exception {
        // 用户枚举防护：不存在的邮箱也返回 200 + 相同成功消息
        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("nonexistent@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.message").exists());
    }

    @Test
    void shouldResetPasswordSuccessfully() throws Exception {
        // 注册、验证、登录获取 refresh token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("reset@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("reset@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        // 请求忘记密码，获取重置 token
        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("reset@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        String resetToken = createAndGetPasswordResetTokenForUser("reset@example.com");
        assert resetToken != null : "测试环境应能获取密码重置 token";

        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken(resetToken);
        resetRequest.setNewPassword("NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // 验证新密码可登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("reset@example.com");
        loginRequest.setPassword("NewPassword123!");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.access_token").exists());
    }

    @Test
    void shouldResetPasswordFailWhenTokenInvalid() throws Exception {
        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken("invalid-token-12345");
        resetRequest.setNewPassword("NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40110)); // PASSWORD_RESET_TOKEN_INVALID
    }

    @Test
    void shouldResetPasswordFailWhenPasswordWeak() throws Exception {
        // 注册、验证、请求忘记密码
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("weak@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("weak@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("weak@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        String resetToken = createAndGetPasswordResetTokenForUser("weak@example.com");
        assert resetToken != null;

        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken(resetToken);
        resetRequest.setNewPassword("weak"); // 密码太弱

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40003)); // PASSWORD_POLICY_VIOLATION
    }

    @Test
    void shouldResetPasswordReturnTokenInvalidOnSecondUse() throws Exception {
        // 注册、验证、请求忘记密码
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("idempotent@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("idempotent@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("idempotent@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        String resetToken = createAndGetPasswordResetTokenForUser("idempotent@example.com");
        assert resetToken != null;

        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken(resetToken);
        resetRequest.setNewPassword("NewPassword123!");

        // 第一次使用成功
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk());

        // 第二次使用同一 token 应返回 TOKEN_INVALID
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40110)); // PASSWORD_RESET_TOKEN_INVALID
    }

    // ==================== GET /auth/me 测试 ====================

    @Test
    void shouldGetCurrentUserSuccessfully() throws Exception {
        // 先注册、验证邮箱，获取 access token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("me@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("me@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );
        String accessToken = loginResponse.getAccessToken();

        // 使用 access token 调用 GET /auth/me
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.email").value("me@example.com"))
                .andExpect(jsonPath("$.data.username").exists())
                .andExpect(jsonPath("$.data.email_verified").value(true))
                .andExpect(jsonPath("$.data.created_at").exists());
    }

    @Test
    void shouldGetCurrentUserFailWhenUnauthorized() throws Exception {
        // 无 Authorization header 应返回 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldGetCurrentUserFailWhenTokenInvalid() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== POST /auth/change-password 测试 ====================

    @Test
    void shouldChangePasswordSuccessfully() throws Exception {
        // 先注册、验证邮箱，获取 access token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("changepw@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("changepw@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );
        String accessToken = loginResponse.getAccessToken();

        // 修改密码
        var changePwRequest = new com.example.api.model.ChangePasswordRequest();
        changePwRequest.setCurrentPassword("Password123!");
        changePwRequest.setNewPassword("NewPassword456!");

        mockMvc.perform(post("/api/auth/change-password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePwRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // 验证新密码可登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("changepw@example.com");
        loginRequest.setPassword("NewPassword456!");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.access_token").exists());
    }

    @Test
    void shouldChangePasswordFailWhenCurrentPasswordWrong() throws Exception {
        // 先注册、验证邮箱，获取 access token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("wrongpw@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("wrongpw@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );
        String accessToken = loginResponse.getAccessToken();

        // 使用错误当前密码修改
        var changePwRequest = new com.example.api.model.ChangePasswordRequest();
        changePwRequest.setCurrentPassword("WrongPassword123!");
        changePwRequest.setNewPassword("NewPassword456!");

        mockMvc.perform(post("/api/auth/change-password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePwRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40102)); // PASSWORD_ERROR
    }

    @Test
    void shouldChangePasswordFailWhenUnauthorized() throws Exception {
        var changePwRequest = new com.example.api.model.ChangePasswordRequest();
        changePwRequest.setCurrentPassword("Password123!");
        changePwRequest.setNewPassword("NewPassword456!");

        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePwRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldChangePasswordFailWhenNewPasswordWeak() throws Exception {
        // 先注册、验证邮箱，获取 access token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("weaknew@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("weaknew@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );
        String accessToken = loginResponse.getAccessToken();

        var changePwRequest = new com.example.api.model.ChangePasswordRequest();
        changePwRequest.setCurrentPassword("Password123!");
        changePwRequest.setNewPassword("weak"); // 密码太弱

        mockMvc.perform(post("/api/auth/change-password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePwRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40003)); // PASSWORD_POLICY_VIOLATION
    }

    @Test
    void shouldResetPasswordRevokeRefreshTokens() throws Exception {
        // 注册、验证、登录获取 refresh token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("revoke@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String verifyToken = createAndGetVerificationTokenForUser("revoke@example.com");
        assert verifyToken != null;
        VerifyEmailRequest verifyReq = new VerifyEmailRequest();
        verifyReq.setToken(verifyToken);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(verifyResponse).get("data").toString(),
            LoginResponse.class
        );
        String refreshToken = loginResponse.getRefreshToken();

        // 请求忘记密码并重置
        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("revoke@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        String resetToken = createAndGetPasswordResetTokenForUser("revoke@example.com");
        assert resetToken != null;

        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken(resetToken);
        resetRequest.setNewPassword("NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk());

        // 验证旧的 refresh token 已失效（撤销后使用会返回 REFRESH_TOKEN_REUSED，因 token 已加入黑名单）
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken(refreshToken);
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40106)); // REFRESH_TOKEN_REUSED（token 已撤销加入黑名单）
    }
}
