package com.example.api.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LoginResponse JSON 序列化测试
 * 
 * TDD 方式：先写测试，驱动实现 LoginResponse DTO 和 OAuth 2.0 字段命名
 * 
 * 测试覆盖：
 * - OAuth 2.0 标准字段序列化命名（snake_case）
 * - access_token、token_type、expires_in、refresh_token 字段
 * - user 扩展字段序列化
 * - 字段值正确序列化
 */
class LoginResponseSerializationTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private LoginResponse response;

    @BeforeEach
    void setUp() {
        response = new LoginResponse();
    }

    @Test
    void shouldLoadLoginResponseClass() {
        assertNotNull(LoginResponse.class, "应存在 LoginResponse DTO 类");
    }

    @Test
    void shouldSerializeAccessTokenAsSnakeCase() throws Exception {
        response.setAccessToken("test_access_token");

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        assertTrue(asMap.containsKey("access_token"), 
                "应包含 access_token 字段（OAuth 2.0 标准命名）");
        assertEquals("test_access_token", asMap.get("access_token"),
                "access_token 值应正确序列化");
        assertFalse(asMap.containsKey("accessToken"),
                "不应包含驼峰命名的 accessToken 字段");
    }

    @Test
    void shouldSerializeTokenTypeAsSnakeCase() throws Exception {
        response.setTokenType("Bearer");

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        assertTrue(asMap.containsKey("token_type"),
                "应包含 token_type 字段（OAuth 2.0 标准命名）");
        assertEquals("Bearer", asMap.get("token_type"),
                "token_type 值应正确序列化");
    }

    @Test
    void shouldSerializeExpiresInAsSnakeCase() throws Exception {
        response.setExpiresIn(1800L);

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        assertTrue(asMap.containsKey("expires_in"),
                "应包含 expires_in 字段（OAuth 2.0 标准命名）");
        assertEquals(1800, asMap.get("expires_in"),
                "expires_in 值应正确序列化");
    }

    @Test
    void shouldSerializeRefreshTokenAsSnakeCase() throws Exception {
        response.setRefreshToken("test_refresh_token");

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        assertTrue(asMap.containsKey("refresh_token"),
                "应包含 refresh_token 字段（OAuth 2.0 标准命名）");
        assertEquals("test_refresh_token", asMap.get("refresh_token"),
                "refresh_token 值应正确序列化");
    }

    @Test
    void shouldSerializeWithOAuthFieldNames() throws Exception {
        // 设置所有字段
        response.setAccessToken("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...");
        response.setTokenType("Bearer");
        response.setExpiresIn(1800L);
        response.setRefreshToken("refresh_token_string");
        response.setScope("read write");

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        // 验证所有 OAuth 2.0 标准字段
        assertTrue(asMap.containsKey("access_token"), "应包含 access_token 字段");
        assertTrue(asMap.containsKey("token_type"), "应包含 token_type 字段");
        assertTrue(asMap.containsKey("expires_in"), "应包含 expires_in 字段");
        assertTrue(asMap.containsKey("refresh_token"), "应包含 refresh_token 字段");
        assertTrue(asMap.containsKey("scope"), "应包含 scope 字段");
    }

    @Test
    void shouldSerializeUserInfo() throws Exception {
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id("123")
                .email("test@example.com")
                .username("testuser")
                .emailVerified(false)
                .build();
        response.setUser(userInfo);

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        assertTrue(asMap.containsKey("user"), "应包含 user 字段");
        
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = (Map<String, Object>) asMap.get("user");
        assertNotNull(userMap, "user 字段应为对象");
        assertEquals("123", userMap.get("id"), "user.id 应正确序列化");
        assertEquals("test@example.com", userMap.get("email"), "user.email 应正确序列化");
        assertEquals("testuser", userMap.get("username"), "user.username 应正确序列化");
        assertEquals(false, userMap.get("email_verified"), "user.email_verified 应正确序列化");
    }

    @Test
    void shouldSerializeCompleteOAuthResponse() throws Exception {
        // 构建完整的 OAuth 2.0 响应
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id("123")
                .email("test@example.com")
                .username("testuser")
                .emailVerified(true)
                .build();

        response = LoginResponse.builder()
                .accessToken("access_token_value")
                .tokenType("Bearer")
                .expiresIn(1800L)
                .refreshToken("refresh_token_value")
                .scope("read write")
                .user(userInfo)
                .build();

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        // 验证所有字段
        assertEquals("access_token_value", asMap.get("access_token"));
        assertEquals("Bearer", asMap.get("token_type"));
        assertEquals(1800, asMap.get("expires_in"));
        assertEquals("refresh_token_value", asMap.get("refresh_token"));
        assertEquals("read write", asMap.get("scope"));
        assertNotNull(asMap.get("user"));
    }

    @Test
    void shouldHandleNullFields() throws Exception {
        // 部分字段为 null
        response.setAccessToken("token");
        // 其他字段为 null

        String json = mapper.writeValueAsString(response);
        Map<?, ?> asMap = mapper.readValue(json, Map.class);

        assertTrue(asMap.containsKey("access_token"), "应包含设置的字段");
        // null 字段可能不包含在 JSON 中，或值为 null
    }

    @Test
    void shouldDeserializeFromOAuthFormat() throws Exception {
        // 测试反序列化（从 OAuth 2.0 格式 JSON）
        String oauthJson = """
                {
                    "access_token": "token_value",
                    "token_type": "Bearer",
                    "expires_in": 1800,
                    "refresh_token": "refresh_value",
                    "scope": "read write"
                }
                """;

        LoginResponse deserialized = mapper.readValue(oauthJson, LoginResponse.class);

        assertNotNull(deserialized, "反序列化结果不应为 null");
        assertEquals("token_value", deserialized.getAccessToken());
        assertEquals("Bearer", deserialized.getTokenType());
        assertEquals(1800L, deserialized.getExpiresIn());
        assertEquals("refresh_value", deserialized.getRefreshToken());
        assertEquals("read write", deserialized.getScope());
    }
}
