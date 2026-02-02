package com.example.user.controller;

import com.example.api.model.LocaleUpdateRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.VerifyEmailRequest;
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

import jakarta.servlet.http.Cookie;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * LocaleController 集成测试（TDD）
 *
 * 测试覆盖：
 * - PATCH /api/user/locale：更新 locale，响应 Set-Cookie
 * - GET /api/user/locale：获取 locale
 * - 未登录返回 401
 * - locale 非法返回 400
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Testcontainers
@TestPropertySource(properties = {
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A",
    "dubbo.protocol.port=-1",
    "jwt.algorithm=RS256",
    "jwt.private-key-path=classpath:keys/private.pem",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.access-token-expiration=1800",
    "jwt.refresh-token-expiration=604800",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com",
    "spring.data.redis.password=",
    "spring.data.redis.database=15",
    "spring.data.redis.timeout=2000",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false",
    "spring.sql.init.mode=always",
    "resend.api-key=",
    "resend.from=onboarding@resend.dev",
    "resend.verification-link-base=http://localhost:5573",
    "rate-limit.verify-email.max-attempts-per-ip=20",
    "rate-limit.verify-email.ip-window-seconds=3600"
})
class LocaleControllerTest {

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
    @Qualifier("stringRedisTemplate")
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private com.example.user.mapper.UserMapper userMapper;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        userMapper.deleteAll();
        try {
            var refreshKeys = redisTemplate.keys("refresh_token:*");
            if (refreshKeys != null && !refreshKeys.isEmpty()) {
                redisTemplate.delete(refreshKeys);
            }
            var blacklistKeys = redisTemplate.keys("blacklist:*");
            if (blacklistKeys != null && !blacklistKeys.isEmpty()) {
                redisTemplate.delete(blacklistKeys);
            }
        } catch (Exception ignored) {
        }
        com.example.user.service.TestTokenStore.clear();
        accessToken = obtainAccessToken();
    }

    private String obtainAccessToken() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("locale-test@example.com");
        registerRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        String token = com.example.user.service.TestTokenStore.getToken("locale-test@example.com");
        if (token == null) {
            throw new IllegalStateException("测试环境应能获取验证 token");
        }

        VerifyEmailRequest verifyRequest = new VerifyEmailRequest();
        verifyRequest.setToken(token);
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LoginResponse loginResponse = objectMapper.readValue(
                objectMapper.readTree(verifyResponse).get("data").toString(),
                LoginResponse.class);
        return loginResponse.getAccessToken();
    }

    @Test
    void shouldUpdateLocaleSuccessfullyAndSetCookie() throws Exception {
        LocaleUpdateRequest request = new LocaleUpdateRequest();
        request.setLocale("en");

        mockMvc.perform(patch("/api/user/locale")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("locale=en")))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.locale").value("en"));
    }

    @Test
    void shouldUpdateLocaleToZh() throws Exception {
        LocaleUpdateRequest request = new LocaleUpdateRequest();
        request.setLocale("zh");

        mockMvc.perform(patch("/api/user/locale")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("locale=zh")))
                .andExpect(jsonPath("$.data.locale").value("zh"));
    }

    @Test
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        LocaleUpdateRequest request = new LocaleUpdateRequest();
        request.setLocale("en");

        mockMvc.perform(patch("/api/user/locale")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn400WhenLocaleNotInWhitelist() throws Exception {
        LocaleUpdateRequest request = new LocaleUpdateRequest();
        request.setLocale("xx"); // 不在白名单

        mockMvc.perform(patch("/api/user/locale")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40005)); // INVALID_LOCALE
    }

    @Test
    void shouldGetLocaleSuccessfully() throws Exception {
        // 先设置 locale
        LocaleUpdateRequest updateRequest = new LocaleUpdateRequest();
        updateRequest.setLocale("ja");
        mockMvc.perform(patch("/api/user/locale")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        // 获取 locale（从 Cookie 读取）
        mockMvc.perform(get("/api/user/locale")
                        .header("Authorization", "Bearer " + accessToken)
                        .cookie(new Cookie("locale", "ja")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.locale").exists());
    }

    @Test
    void shouldReturn401WhenGetLocaleNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/user/locale"))
                .andExpect(status().isUnauthorized());
    }
}
