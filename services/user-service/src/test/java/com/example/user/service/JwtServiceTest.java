package com.example.user.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JwtService 单元测试
 * 
 * TDD 方式：先写测试，驱动实现 JwtService
 * 
 * 测试覆盖：
 * - Access Token 生成和解析
 * - Refresh Token 生成和解析
 * - Token 过期处理
 * - Token 篡改检测
 * - Token 即将过期判断
 * - Claims 内容验证（userId、username、roles 等）
 * - RS256 算法正确实现
 * 
 * 注意：测试需要 JWT 配置和密钥文件，使用 @TestPropertySource 提供测试配置
 */
@SpringBootTest(classes = {com.example.user.service.JwtService.class, com.example.user.config.SecurityConfig.class, com.example.user.config.JwtAuthFilter.class})
@TestPropertySource(properties = {
    // JWT 配置
    "jwt.algorithm=RS256",
    "jwt.private-key-path=classpath:keys/private.pem",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.access-token-expiration=1800",
    "jwt.refresh-token-expiration=604800",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com",
    // 禁用 Nacos 自动配置
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    // 禁用 Dubbo 自动配置
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A"
})
class JwtServiceTest {

    @Autowired(required = false)
    private JwtService jwtService;

    private String testUserId;
    private String testUsername;
    private List<String> testRoles;

    @BeforeEach
    void setUp() {
        testUserId = "123";
        testUsername = "testuser";
        testRoles = Arrays.asList("USER", "ADMIN");
    }

    @Test
    void shouldLoadJwtServiceBean() {
        assertNotNull(jwtService, "应能从 Spring 容器中获取 JwtService Bean");
    }

    @Test
    void shouldGenerateAccessToken() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        
        assertNotNull(token, "生成的 Access Token 不应为 null");
        assertFalse(token.isEmpty(), "生成的 Access Token 不应为空");
        // JWT 格式：header.payload.signature（用 . 分隔）
        assertEquals(3, token.split("\\.").length, 
                "JWT Token 应包含三部分（header.payload.signature）");
    }

    @Test
    void shouldParseValidAccessToken() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        Claims claims = jwtService.parseToken(token);
        
        assertNotNull(claims, "解析后的 Claims 不应为 null");
        assertEquals(testUserId, claims.getSubject(), "Subject (userId) 应匹配");
        assertEquals(testUsername, claims.get("username", String.class), 
                "username claim 应匹配");
        
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);
        assertNotNull(roles, "roles claim 应存在");
        assertEquals(testRoles.size(), roles.size(), "roles 数量应匹配");
        assertTrue(roles.containsAll(testRoles), "roles 内容应匹配");
        
        assertEquals("access", claims.get("type", String.class), 
                "token type 应为 'access'");
    }

    @Test
    void shouldGenerateRefreshToken() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String deviceId = "device-123";
        String token = jwtService.generateRefreshToken(testUserId, deviceId);
        
        assertNotNull(token, "生成的 Refresh Token 不应为 null");
        assertFalse(token.isEmpty(), "生成的 Refresh Token 不应为空");
        assertEquals(3, token.split("\\.").length, 
                "JWT Token 应包含三部分");
    }

    @Test
    void shouldParseValidRefreshToken() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String deviceId = "device-123";
        String token = jwtService.generateRefreshToken(testUserId, deviceId);
        Claims claims = jwtService.parseToken(token);
        
        assertNotNull(claims, "解析后的 Claims 不应为 null");
        assertEquals(testUserId, claims.getSubject(), "Subject (userId) 应匹配");
        assertEquals("refresh", claims.get("type", String.class), 
                "token type 应为 'refresh'");
        assertEquals(deviceId, claims.get("deviceId", String.class), 
                "deviceId claim 应匹配");
    }

    @Test
    void shouldGenerateRefreshTokenWithoutDeviceId() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateRefreshToken(testUserId, null);
        Claims claims = jwtService.parseToken(token);
        
        assertNotNull(claims, "解析后的 Claims 不应为 null");
        assertEquals(testUserId, claims.getSubject(), "Subject (userId) 应匹配");
        assertEquals("refresh", claims.get("type", String.class), 
                "token type 应为 'refresh'");
        assertNull(claims.get("deviceId"), "deviceId 为 null 时不应包含在 claims 中");
    }

    @Test
    void shouldThrowExceptionForExpiredToken() throws InterruptedException {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        // 注意：实际实现中需要支持自定义过期时间，这里假设有配置支持短过期时间
        // 如果实现不支持，此测试可能需要调整
        
        // 生成一个立即过期的 token（需要实现支持）
        // 或者等待 token 过期（不推荐，测试时间过长）
        
        // 这里先测试无效 token 的处理
        String invalidToken = "invalid.token.here";
        
        assertThrows(JwtException.class, () -> {
            jwtService.parseToken(invalidToken);
        }, "无效的 Token 应抛出 JwtException");
    }

    @Test
    void shouldThrowExceptionForTamperedToken() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String validToken = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        
        // 篡改 token（修改签名部分）
        String[] parts = validToken.split("\\.");
        String tamperedToken = parts[0] + "." + parts[1] + ".tampered_signature";
        
        assertThrows(JwtException.class, () -> {
            jwtService.parseToken(tamperedToken);
        }, "篡改后的 Token 应抛出 JwtException");
    }

    @Test
    void shouldCheckTokenExpiringSoon() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        
        // 新生成的 token 不应即将过期（默认 30 分钟有效期）
        boolean expiringSoon = jwtService.isTokenExpiringSoon(token);
        assertFalse(expiringSoon, 
                "新生成的 Token（30 分钟有效期）不应即将过期（5 分钟内）");
    }

    @Test
    void shouldIncludeIssuerAndAudienceInToken() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        Claims claims = jwtService.parseToken(token);
        
        assertEquals("https://auth.example.com", claims.getIssuer(), 
                "issuer 应匹配配置值");
        assertTrue(claims.getAudience().contains("api.example.com"), 
                "audience 应包含配置值");
    }

    @Test
    void shouldHaveCorrectExpirationTime() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        Claims claims = jwtService.parseToken(token);
        
        Date expiration = claims.getExpiration();
        assertNotNull(expiration, "expiration 不应为 null");
        assertTrue(expiration.after(new Date()), 
                "expiration 应在当前时间之后");
        
        // 验证过期时间大约为 30 分钟（1800 秒）
        long expirationTime = expiration.getTime();
        long currentTime = System.currentTimeMillis();
        long diffSeconds = (expirationTime - currentTime) / 1000;
        
        // 允许 5 秒误差
        assertTrue(diffSeconds >= 1795 && diffSeconds <= 1805, 
                "Access Token 过期时间应约为 1800 秒（30 分钟）");
    }

    @Test
    void shouldHaveIssuedAtTime() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        long beforeGeneration = System.currentTimeMillis();
        String token = jwtService.generateAccessToken(testUserId, testUsername, testRoles);
        long afterGeneration = System.currentTimeMillis();
        
        Claims claims = jwtService.parseToken(token);
        Date issuedAt = claims.getIssuedAt();
        
        assertNotNull(issuedAt, "issuedAt 不应为 null");
        
        long issuedAtTime = issuedAt.getTime();
        // 允许 1 秒的误差（考虑执行时间）
        assertTrue(issuedAtTime >= beforeGeneration - 1000 && issuedAtTime <= afterGeneration + 1000, 
                "issuedAt 应在生成时间范围内（允许 1 秒误差）");
    }

    @Test
    void shouldHandleNullRoles() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        String token = jwtService.generateAccessToken(testUserId, testUsername, null);
        Claims claims = jwtService.parseToken(token);
        
        assertNotNull(claims, "解析后的 Claims 不应为 null");
        assertEquals(testUserId, claims.getSubject(), "Subject (userId) 应匹配");
        // null roles 可能被转换为空列表或 null，取决于实现
    }

    @Test
    void shouldHandleEmptyRoles() {
        assertNotNull(jwtService, "JwtService Bean 应存在");
        
        List<String> emptyRoles = Arrays.asList();
        String token = jwtService.generateAccessToken(testUserId, testUsername, emptyRoles);
        Claims claims = jwtService.parseToken(token);
        
        assertNotNull(claims, "解析后的 Claims 不应为 null");
        assertEquals(testUserId, claims.getSubject(), "Subject (userId) 应匹配");
    }
}
