package com.example.chat.service;

import com.example.chat.util.TestJwtHelper;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JwtValidationService 单元测试（TDD）
 * 验证：有效 Token 解析、过期 Token、无效 Token
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.cloud.nacos.discovery.enabled=false",
    "jwt.algorithm=RS256",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com"
})
class JwtValidationServiceTest {

    @Autowired
    private JwtValidationService jwtValidationService;

    private String validToken;

    @BeforeEach
    void setUp() {
        validToken = TestJwtHelper.generateAccessToken("123", "testuser", List.of("USER"));
    }

    @Test
    void shouldParseValidToken() {
        var claims = jwtValidationService.parseToken(validToken);

        assertEquals("123", claims.getSubject());
        assertEquals("testuser", claims.get("username"));
        assertNotNull(claims.getExpiration());
    }

    @Test
    void shouldExtractUserIdFromValidToken() {
        String userId = jwtValidationService.extractUserId(validToken);

        assertEquals("123", userId);
    }

    @Test
    void shouldThrowWhenTokenInvalid() {
        assertThrows(JwtException.class, () ->
                jwtValidationService.parseToken("invalid.token.here"));
    }

    @Test
    void shouldThrowWhenTokenMalformed() {
        assertThrows(JwtException.class, () ->
                jwtValidationService.parseToken("not-a-jwt"));
    }
}
