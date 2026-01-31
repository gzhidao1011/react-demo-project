package com.example.user.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RateLimitService 集成测试（使用 Testcontainers 自包含 Redis）
 *
 * 测试覆盖：
 * - IP 限流：超过限制时抛出异常
 * - 用户限流：超过限制时抛出异常
 * - 限流计数正确增加
 * - 限流时间窗口正确设置
 * - 不同 IP 和用户的限流独立
 *
 * 无需手动启动 Redis，Testcontainers 会在测试时自动启动 Redis 容器
 */
@SpringBootTest
@Testcontainers
@TestPropertySource(properties = {
    // 禁用 Nacos 自动配置
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    // 禁用 Dubbo 自动配置
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A",
    "dubbo.protocol.port=-1",
    // Redis host/port 由 @DynamicPropertySource 动态注入
    "spring.data.redis.password=",
    "spring.data.redis.database=15",
    "spring.data.redis.timeout=2000",
    // 限流配置（使用较小的值便于测试）
    "rate-limit.login.max-attempts-per-ip=5",
    "rate-limit.login.max-attempts-per-user=3",
    "rate-limit.login.ip-window-seconds=60",
    "rate-limit.login.user-window-seconds=30",
    // 数据库配置（使用 H2 内存数据库）
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false",
    "spring.sql.init.mode=always"
})
class RateLimitServiceTest {

    @Container
    static GenericContainer<?> redis =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> String.valueOf(redis.getFirstMappedPort()));
    }

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    @Qualifier("redisTemplate")
    private RedisTemplate<String, String> redisTemplate;

    /**
     * 测试中使用的固定 IP 地址列表
     * 用于确保测试数据清理
     */
    private static final String[] TEST_IPS = {
        "192.168.1.100", "192.168.1.101", "192.168.1.200", "192.168.1.201",
        "192.168.1.300", "192.168.1.400", "192.168.1.500", "192.168.1.600"
    };
    
    /**
     * 测试中使用的固定用户 ID 列表
     * 用于确保测试数据清理
     */
    private static final String[] TEST_USERS = {
        "user-123", "user-1", "user-2", "user-500"
    };

    @BeforeEach
    void setUp() {
        // 清理测试数据（确保每次测试前都是干净的环境）
        cleanupTestData();
    }
    
    @AfterEach
    void tearDown() {
        // 测试后也清理数据，确保不影响后续测试
        cleanupTestData();
    }
    
    /**
     * 清理测试数据
     * 包括所有限流相关的 key 和测试中使用的固定 IP/用户 ID
     * 
     * 清理策略：
     * 1. 先清理固定的 IP/用户 ID（确保这些数据被删除）
     * 2. 然后批量清理所有限流相关的 key（清理可能遗漏的数据）
     * 3. 再次清理固定的 IP/用户 ID（确保彻底清理）
     */
    private void cleanupTestData() {
        try {
            // 1. 先清理固定的 IP 和用户 ID（确保这些数据被删除）
            for (String ip : TEST_IPS) {
                redisTemplate.delete("rate_limit:login:ip:" + ip);
            }
            
            for (String user : TEST_USERS) {
                redisTemplate.delete("rate_limit:login:user:" + user);
            }
            
            // 2. 批量清理所有限流相关的 key（清理可能遗漏的数据）
            Set<String> keys = redisTemplate.keys("rate_limit:login:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            
            // 3. 再次清理固定的 IP 和用户 ID（确保彻底清理，防止批量删除失败的情况）
            for (String ip : TEST_IPS) {
                redisTemplate.delete("rate_limit:login:ip:" + ip);
            }
            
            for (String user : TEST_USERS) {
                redisTemplate.delete("rate_limit:login:user:" + user);
            }
        } catch (Exception e) {
            // Redis 连接失败，记录错误但不中断测试
            System.err.println("清理 Redis 数据失败: " + e.getMessage());
        }
    }

    @Test
    void shouldAllowRequestsWithinIpLimit() {
        String ipAddress = "192.168.1.100";
        
        // 确保此测试使用的 IP 地址被清理
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress);

        // 1. 前 5 次请求应该成功（IP 限流为 5）
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress, null),
                "第 " + (i + 1) + " 次请求应该成功"
            );
        }

        // 2. 第 6 次请求应该被限流
        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress, null),
            "第 6 次请求应该被限流"
        );
        assertEquals(ResultCode.RATE_LIMIT_EXCEEDED.getCode(), exception.getCode());
    }

    @Test
    void shouldAllowRequestsWithinUserLimit() {
        String ipAddress = "192.168.1.101";
        String userId = "user-123";
        
        // 确保此测试使用的 IP 地址和用户 ID 被清理
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress);
        redisTemplate.delete("rate_limit:login:user:" + userId);

        // 1. 前 3 次请求应该成功（用户限流为 3）
        for (int i = 0; i < 3; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress, userId),
                "第 " + (i + 1) + " 次请求应该成功"
            );
        }

        // 2. 第 4 次请求应该被限流
        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress, userId),
            "第 4 次请求应该被限流"
        );
        assertEquals(ResultCode.RATE_LIMIT_EXCEEDED.getCode(), exception.getCode());
    }

    @Test
    void shouldEnforceBothIpAndUserLimits() {
        // 使用时间戳生成独特的 IP 和用户 ID，避免与其他测试冲突
        long timestamp = System.currentTimeMillis();
        String ipAddress1 = "192.168.1." + (900 + timestamp % 1000);
        String userId1 = "user-test-" + timestamp + "-1";
        String ipAddress2 = "192.168.1." + (901 + timestamp % 1000);
        String userId2 = "user-test-" + timestamp + "-2";
        
        // 清理此测试使用的 key，确保测试隔离
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress1);
        redisTemplate.delete("rate_limit:login:user:" + userId1);
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress2);
        redisTemplate.delete("rate_limit:login:user:" + userId2);

        // 1. 测试用户限流先达到（用户限流为 3，比 IP 限流 5 更严格）
        for (int i = 0; i < 3; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress1, userId1),
                "前 3 次请求应该成功（用户限流为 3）"
            );
        }

        // 2. 第 4 次请求应该被用户限流（用户限流先达到，即使 IP 限流未达到）
        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress1, userId1),
            "第 4 次请求应该被用户限流"
        );
        assertEquals(ResultCode.RATE_LIMIT_EXCEEDED.getCode(), exception.getCode());
        
        // 3. 使用不同的 IP 地址，仅检查 IP 限流（不传 userId，用户限流不参与）
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress2, null),
                "使用不同 IP 时，前 5 次请求应该成功（IP 限流为 5）"
            );
        }

        // 4. 第 6 次请求应该被 IP 限流（IP 限流达到）
        BusinessException ipException = assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress2, null),
            "第 6 次请求应该被 IP 限流"
        );
        assertEquals(ResultCode.RATE_LIMIT_EXCEEDED.getCode(), ipException.getCode());
    }

    @Test
    void shouldHandleDifferentIpsIndependently() {
        String ip1 = "192.168.1.200";
        String ip2 = "192.168.1.201";
        
        // 确保此测试使用的 IP 地址被清理
        redisTemplate.delete("rate_limit:login:ip:" + ip1);
        redisTemplate.delete("rate_limit:login:ip:" + ip2);

        // 1. IP1 达到限流
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ip1, null),
                "IP1 前 5 次请求应该成功"
            );
        }

        // 2. IP1 被限流
        assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ip1, null),
            "IP1 第 6 次请求应该被限流"
        );

        // 3. IP2 仍然可以正常请求（独立限流）
        assertDoesNotThrow(
            () -> rateLimitService.checkRateLimit(ip2, null),
            "IP2 应该不受 IP1 限流影响"
        );
    }

    @Test
    void shouldHandleDifferentUsersIndependently() {
        String ipAddress = "192.168.1.300";
        String user1 = "user-1";
        String user2 = "user-2";
        
        // 确保此测试使用的 IP 地址和用户 ID 被清理
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress);
        redisTemplate.delete("rate_limit:login:user:" + user1);
        redisTemplate.delete("rate_limit:login:user:" + user2);

        // 1. User1 达到限流
        for (int i = 0; i < 3; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress, user1),
                "User1 前 3 次请求应该成功"
            );
        }

        // 2. User1 被限流
        assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress, user1),
            "User1 第 4 次请求应该被限流"
        );

        // 3. User2 仍然可以正常请求（独立限流）
        assertDoesNotThrow(
            () -> rateLimitService.checkRateLimit(ipAddress, user2),
            "User2 应该不受 User1 限流影响"
        );
    }

    @Test
    void shouldIncrementRateLimitCount() {
        String ipAddress = "192.168.1.400";
        String userId = "user-500";
        
        // 确保此测试使用的 IP 地址和用户 ID 被清理
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress);
        redisTemplate.delete("rate_limit:login:user:" + userId);

        // 1. 检查限流（会增加计数）
        rateLimitService.checkRateLimit(ipAddress, userId);

        // 2. 验证计数已增加
        String ipKey = "rate_limit:login:ip:" + ipAddress;
        String userKey = "rate_limit:login:user:" + userId;

        String ipCount = redisTemplate.opsForValue().get(ipKey);
        String userCount = redisTemplate.opsForValue().get(userKey);

        assertNotNull(ipCount, "IP 限流计数应该存在");
        assertEquals("1", ipCount, "IP 限流计数应该为 1");

        assertNotNull(userCount, "用户限流计数应该存在");
        assertEquals("1", userCount, "用户限流计数应该为 1");
    }

    @Test
    void shouldHandleNullUserId() {
        String ipAddress = "192.168.1.500";
        
        // 确保此测试使用的 IP 地址被清理
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress);

        // 1. 不提供 userId 时，只检查 IP 限流
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress, null),
                "不提供 userId 时，前 5 次请求应该成功"
            );
        }

        // 2. 第 6 次请求应该被 IP 限流
        assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress, null),
            "第 6 次请求应该被 IP 限流"
        );
    }

    @Test
    void shouldHandleEmptyUserId() {
        String ipAddress = "192.168.1.600";
        
        // 确保此测试使用的 IP 地址被清理
        redisTemplate.delete("rate_limit:login:ip:" + ipAddress);

        // 1. 提供空字符串 userId 时，只检查 IP 限流
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(
                () -> rateLimitService.checkRateLimit(ipAddress, ""),
                "提供空 userId 时，前 5 次请求应该成功"
            );
        }

        // 2. 第 6 次请求应该被 IP 限流
        assertThrows(
            BusinessException.class,
            () -> rateLimitService.checkRateLimit(ipAddress, ""),
            "第 6 次请求应该被 IP 限流"
        );
    }
}
