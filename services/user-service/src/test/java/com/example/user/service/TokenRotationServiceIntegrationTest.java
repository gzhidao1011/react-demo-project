package com.example.user.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * TokenRotationService 集成测试（使用 Docker 部署的 Redis）
 *
 * 测试覆盖：
 * - Token 存储和验证
 * - Token 轮换（标记旧 Token 已使用）
 * - Token 撤销（加入黑名单）
 * - Token 重用检测
 *
 * 运行前请先启动 Redis：docker-compose up -d redis（连接 localhost:6379）
 * 若 Redis 不可用，测试将被跳过
 */
@SpringBootTest
@Transactional
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
    // Redis 配置（使用 Docker 部署的 Redis，localhost:6379）
    "spring.data.redis.host=${REDIS_HOST:localhost}",
    "spring.data.redis.port=${REDIS_PORT:6379}",
    "spring.data.redis.password=${REDIS_PASSWORD:}",
    "spring.data.redis.database=15",
    "spring.data.redis.timeout=2000",
    // 数据库配置（使用 H2 内存数据库）
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    // 禁用 Flyway（测试使用 Hibernate 自动创建表）
    "spring.flyway.enabled=false"
})
class TokenRotationServiceIntegrationTest {

    @Autowired(required = false)
    private TokenRotationService tokenRotationService;
    
    @Autowired(required = false)
    private JwtService jwtService;
    
    @Autowired(required = false)
    @Qualifier("stringRedisTemplate")
    private RedisTemplate<String, String> redisTemplate;

    private String testUserId;
    private String testDeviceId;
    private String refreshToken1;
    private String refreshToken2;

    @BeforeEach
    void setUp() {
        // 检查 Redis 是否可用（需先启动 Docker Redis：docker-compose up -d redis）
        assumeTrue(tokenRotationService != null && redisTemplate != null && jwtService != null,
            "Redis 不可用，跳过集成测试。请先启动 Docker Redis：docker-compose up -d redis");
        
        testUserId = "123";
        testDeviceId = "device-123";
        
        // 清理测试数据
        try {
            // 清理所有测试相关的 key
            redisTemplate.delete(redisTemplate.keys("refresh_token:*"));
            redisTemplate.delete(redisTemplate.keys("blacklist:*"));
        } catch (Exception e) {
            // Redis 连接失败，跳过测试
        }
        
        // 生成测试用的 Refresh Token
        refreshToken1 = jwtService.generateRefreshToken(testUserId, testDeviceId);
        refreshToken2 = jwtService.generateRefreshToken(testUserId, testDeviceId);
    }

    @Test
    void shouldStoreAndValidateRefreshToken() {
        
        // 1. 存储 Refresh Token
        tokenRotationService.storeRefreshToken(testUserId, testDeviceId, refreshToken1);
        
        // 2. 验证 Token 有效
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, refreshToken1),
            "存储后的 Token 应该有效"
        );
        
        // 3. 验证错误的 Token 无效
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, "invalid-token"),
            "错误的 Token 应该无效"
        );
        
        // 4. 验证错误的用户ID无效
        assertFalse(
            tokenRotationService.validateRefreshToken("999", testDeviceId, refreshToken1),
            "错误的用户ID应该无效"
        );
    }

    @Test
    void shouldRotateToken() {
        
        // 1. 存储旧的 Refresh Token
        tokenRotationService.storeRefreshToken(testUserId, testDeviceId, refreshToken1);
        
        // 2. 验证旧 Token 有效
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, refreshToken1),
            "旧 Token 应该有效"
        );
        
        // 3. 标记旧 Token 已使用（Token 轮换）
        tokenRotationService.markTokenAsUsed(testUserId, testDeviceId, refreshToken1);
        
        // 4. 验证旧 Token 已无效（已从 Redis 删除）
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, refreshToken1),
            "标记为已使用的 Token 应该无效"
        );
        
        // 5. 验证旧 Token 在黑名单中
        assertTrue(
            tokenRotationService.checkTokenReuse(refreshToken1),
            "已使用的 Token 应该在黑名单中"
        );
        
        // 6. 存储新的 Refresh Token
        tokenRotationService.storeRefreshToken(testUserId, testDeviceId, refreshToken2);
        
        // 7. 验证新 Token 有效
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, refreshToken2),
            "新 Token 应该有效"
        );
    }

    @Test
    void shouldDetectTokenReuse() {
        
        // 1. 存储 Refresh Token
        tokenRotationService.storeRefreshToken(testUserId, testDeviceId, refreshToken1);
        
        // 2. 标记 Token 已使用
        tokenRotationService.markTokenAsUsed(testUserId, testDeviceId, refreshToken1);
        
        // 3. 检测 Token 重用（尝试重用已使用的 Token）
        assertTrue(
            tokenRotationService.checkTokenReuse(refreshToken1),
            "已使用的 Token 应该被检测为重用"
        );
        
        // 4. 验证新 Token 未被重用
        assertFalse(
            tokenRotationService.checkTokenReuse(refreshToken2),
            "新 Token 不应该被检测为重用"
        );
    }

    @Test
    void shouldRevokeToken() {
        
        // 1. 存储 Refresh Token
        tokenRotationService.storeRefreshToken(testUserId, testDeviceId, refreshToken1);
        
        // 2. 验证 Token 有效
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, refreshToken1),
            "Token 应该有效"
        );
        
        // 3. 撤销 Token（登出）
        tokenRotationService.revokeToken(refreshToken1);
        
        // 4. 验证 Token 已无效（在黑名单中）
        assertTrue(
            tokenRotationService.checkTokenReuse(refreshToken1),
            "撤销后的 Token 应该在黑名单中"
        );
        
        // 5. 验证 Token 无法验证（已从 Redis 删除或已加入黑名单）
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, refreshToken1),
            "撤销后的 Token 应该无效"
        );
    }

    @Test
    void shouldHandleTokenWithoutDeviceId() {
        
        // 1. 生成不带 deviceId 的 Token
        String tokenWithoutDevice = jwtService.generateRefreshToken(testUserId, null);
        
        // 2. 存储 Token（deviceId 为 null）
        tokenRotationService.storeRefreshToken(testUserId, null, tokenWithoutDevice);
        
        // 3. 验证 Token 有效
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, null, tokenWithoutDevice),
            "不带 deviceId 的 Token 应该有效"
        );
        
        // 4. 验证带 deviceId 的 Token 无效（不同的 key）
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, testDeviceId, tokenWithoutDevice),
            "deviceId 不匹配的 Token 应该无效"
        );
    }

    @Test
    void shouldHandleMultipleDevices() {
        
        String deviceId1 = "device-1";
        String deviceId2 = "device-2";
        String token1 = jwtService.generateRefreshToken(testUserId, deviceId1);
        String token2 = jwtService.generateRefreshToken(testUserId, deviceId2);
        
        // 1. 为不同设备存储不同的 Token
        tokenRotationService.storeRefreshToken(testUserId, deviceId1, token1);
        tokenRotationService.storeRefreshToken(testUserId, deviceId2, token2);
        
        // 2. 验证每个设备的 Token 都有效
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, deviceId1, token1),
            "设备 1 的 Token 应该有效"
        );
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, deviceId2, token2),
            "设备 2 的 Token 应该有效"
        );
        
        // 3. 验证设备间的 Token 不能互相使用
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, deviceId1, token2),
            "设备 1 不能使用设备 2 的 Token"
        );
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, deviceId2, token1),
            "设备 2 不能使用设备 1 的 Token"
        );
        
        // 4. 撤销设备 1 的 Token
        tokenRotationService.revokeToken(token1);
        
        // 5. 验证设备 1 的 Token 已无效，但设备 2 的 Token 仍然有效
        assertFalse(
            tokenRotationService.validateRefreshToken(testUserId, deviceId1, token1),
            "设备 1 的 Token 应该已无效"
        );
        assertTrue(
            tokenRotationService.validateRefreshToken(testUserId, deviceId2, token2),
            "设备 2 的 Token 应该仍然有效"
        );
    }
}
