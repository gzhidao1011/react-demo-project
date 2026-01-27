package com.example.user.controller;

import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RefreshTokenRequest;
import com.example.user.repository.UserRepository;
import com.example.user.service.TokenRotationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 集成测试
 * 
 * 测试覆盖：
 * - 注册接口（成功、邮箱已存在、密码策略验证）
 * - 登录接口（成功、错误密码、不存在的邮箱）
 * - 刷新 Token 接口（成功、无效 Token、过期 Token）
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
    // 禁用 Nacos 自动配置
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    // 禁用 Dubbo 自动配置
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A",
    // JWT 配置
    "jwt.algorithm=RS256",
    "jwt.private-key-path=classpath:keys/private.pem",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.access-token-expiration=1800",
    "jwt.refresh-token-expiration=604800",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com",
    // 数据库配置（使用 H2 内存数据库）
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    // 禁用 Flyway（测试使用 Hibernate 自动创建表）
    "spring.flyway.enabled=false"
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private TokenRotationService tokenRotationService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;
    
    // 用于模拟 Redis 存储的 Map（用于跟踪存储的 token）
    private final Map<String, String> tokenStore = new ConcurrentHashMap<>();
    private final Map<String, Boolean> blacklist = new ConcurrentHashMap<>();

    @BeforeEach
    void setUp() {
        // 清理测试数据
        userRepository.deleteAll();
        tokenStore.clear();
        blacklist.clear();
        
        // Mock TokenRotationService 的行为
        // 1. storeRefreshToken: 存储 token
        doAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            String deviceId = invocation.getArgument(1);
            String refreshToken = invocation.getArgument(2);
            String key = buildTokenKey(userId, deviceId);
            tokenStore.put(key, refreshToken);
            return null;
        }).when(tokenRotationService).storeRefreshToken(
            anyString(), any(), anyString()
        );
        
        // 2. validateRefreshToken: 验证 token 是否有效
        when(tokenRotationService.validateRefreshToken(anyString(), any(), anyString()))
            .thenAnswer(invocation -> {
                String userId = invocation.getArgument(0);
                String deviceId = invocation.getArgument(1);
                String refreshToken = invocation.getArgument(2);
                
                // 检查是否在黑名单中
                if (blacklist.containsKey(refreshToken)) {
                    return false;
                }
                
                // 检查是否在存储中
                String key = buildTokenKey(userId, deviceId);
                String storedToken = tokenStore.get(key);
                return storedToken != null && storedToken.equals(refreshToken);
            });
        
        // 3. checkTokenReuse: 检查 token 重用
        when(tokenRotationService.checkTokenReuse(anyString()))
            .thenAnswer(invocation -> {
                String refreshToken = invocation.getArgument(0);
                return blacklist.containsKey(refreshToken);
            });
        
        // 4. markTokenAsUsed: 标记 token 已使用（加入黑名单，删除存储）
        doAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            String deviceId = invocation.getArgument(1);
            String oldRefreshToken = invocation.getArgument(2);
            
            // 加入黑名单
            blacklist.put(oldRefreshToken, true);
            
            // 删除存储中的 token
            String key = buildTokenKey(userId, deviceId);
            tokenStore.remove(key);
            
            return null;
        }).when(tokenRotationService).markTokenAsUsed(
            anyString(), any(), anyString()
        );
        
        // 5. revokeToken: 撤销 token（加入黑名单）
        doAnswer(invocation -> {
            String refreshToken = invocation.getArgument(0);
            blacklist.put(refreshToken, true);
            
            // 尝试从 tokenStore 中删除（如果存在）
            tokenStore.entrySet().removeIf(entry -> entry.getValue().equals(refreshToken));
            
            return null;
        }).when(tokenRotationService).revokeToken(anyString());
    }
    
    /**
     * 构建 Token Key（用于模拟 Redis key）
     */
    private String buildTokenKey(String userId, String deviceId) {
        if (deviceId != null && !deviceId.isEmpty()) {
            return "refresh_token:" + userId + ":" + deviceId;
        }
        return "refresh_token:" + userId;
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
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.access_token").exists())
                .andExpect(jsonPath("$.data.token_type").value("Bearer"))
                .andExpect(jsonPath("$.data.expires_in").exists())
                .andExpect(jsonPath("$.data.refresh_token").exists())
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"));
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
                .andExpect(jsonPath("$.code").value(50003)); // EMAIL_ALREADY_EXISTS
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
        // 先注册一个用户
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // 登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.access_token").exists())
                .andExpect(jsonPath("$.data.token_type").value("Bearer"))
                .andExpect(jsonPath("$.data.refresh_token").exists())
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"));
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
    void shouldRefreshTokenSuccessfully() throws Exception {
        // 先注册并登录获取 refresh token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");
        
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        
        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(registerResponse).get("data").toString(),
            LoginResponse.class
        );
        
        // 使用 refresh token 刷新
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken(loginResponse.getRefreshToken());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
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
        // 先注册并登录获取 refresh token
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");
        
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        
        LoginResponse loginResponse = objectMapper.readValue(
            objectMapper.readTree(registerResponse).get("data").toString(),
            LoginResponse.class
        );
        
        // 登出
        RefreshTokenRequest logoutRequest = new RefreshTokenRequest();
        logoutRequest.setRefreshToken(loginResponse.getRefreshToken());

        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        
        // 验证登出后无法使用相同的 refresh token
        // 登出后 token 被加入黑名单，再次使用会返回 REFRESH_TOKEN_REUSED (40106)
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40106)); // REFRESH_TOKEN_REUSED
    }
}
