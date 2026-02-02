package com.example.user.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SecurityConfig 单元测试
 * 
 * TDD 方式：先写测试，驱动实现 SecurityConfig 和 PasswordEncoder Bean
 * 
 * 测试覆盖：
 * - PasswordEncoder Bean 成功加载
 * - 密码加密功能正常
 * - 密码验证功能正常
 * - 使用 BCrypt 算法（成本因子 12）
 * - 相同密码加密结果不同（盐值随机）
 * - 不同密码不能匹配
 */
@SpringBootTest(classes = SecurityConfig.class)
@TestPropertySource(properties = {
    // 禁用 Nacos 自动配置
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    // 禁用 Dubbo 自动配置
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A",
    // 禁用 Redis 自动配置（此测试不需要 Redis）
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration"
})
class SecurityConfigTest {

    /** Mock JwtAuthFilter，SecurityConfig 依赖它但本测试不验证 JWT */
    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldLoadPasswordEncoderBean() {
        assertNotNull(passwordEncoder, "应能从 Spring 容器中获取 PasswordEncoder Bean");
        assertTrue(passwordEncoder instanceof BCryptPasswordEncoder, 
                "PasswordEncoder 应为 BCryptPasswordEncoder 实例");
    }

    @Test
    void shouldEncodePassword() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        
        String rawPassword = "testPassword123";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        assertNotNull(encodedPassword, "编码后的密码不应为 null");
        assertFalse(encodedPassword.isEmpty(), "编码后的密码不应为空");
        assertTrue(encodedPassword.startsWith("$2a$"), 
                "BCrypt 哈希值应以 $2a$ 开头");
        assertTrue(encodedPassword.length() >= 60, 
                "BCrypt 哈希值长度应至少 60 字符");
    }

    @Test
    void shouldMatchPasswordAfterEncoding() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        
        String rawPassword = "testPassword123";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword), 
                "编码后的密码应能匹配原始密码");
    }

    @Test
    void shouldNotMatchWrongPassword() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        
        String correctPassword = "testPassword123";
        String wrongPassword = "wrongPassword456";
        String encodedPassword = passwordEncoder.encode(correctPassword);
        
        assertFalse(passwordEncoder.matches(wrongPassword, encodedPassword), 
                "错误的密码不应匹配");
    }

    @Test
    void shouldGenerateDifferentHashesForSamePassword() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        
        String rawPassword = "testPassword123";
        String encoded1 = passwordEncoder.encode(rawPassword);
        String encoded2 = passwordEncoder.encode(rawPassword);
        
        // BCrypt 使用随机盐值，相同密码的哈希值应该不同
        assertNotEquals(encoded1, encoded2, 
                "相同密码的两次加密结果应不同（因为使用了随机盐值）");
        
        // 但都能匹配原始密码
        assertTrue(passwordEncoder.matches(rawPassword, encoded1), 
                "第一次加密结果应能匹配原始密码");
        assertTrue(passwordEncoder.matches(rawPassword, encoded2), 
                "第二次加密结果应能匹配原始密码");
    }

    @Test
    void shouldUseBCryptWithStrength12() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        assertTrue(passwordEncoder instanceof BCryptPasswordEncoder, 
                "应使用 BCryptPasswordEncoder");
        
        BCryptPasswordEncoder bcryptEncoder = (BCryptPasswordEncoder) passwordEncoder;
        
        // 验证成本因子为 12（通过检查哈希值格式：$2a$12$...）
        String encoded = passwordEncoder.encode("test");
        assertTrue(encoded.startsWith("$2a$12$"), 
                "BCrypt 成本因子应为 12（推荐值，平衡安全性和性能）");
    }

    @Test
    void shouldHandleEmptyPassword() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        
        String emptyPassword = "";
        String encoded = passwordEncoder.encode(emptyPassword);
        
        assertNotNull(encoded, "空密码也应能编码");
        assertTrue(passwordEncoder.matches(emptyPassword, encoded), 
                "空密码编码后应能匹配");
    }

    @Test
    void shouldHandleLongPassword() {
        assertNotNull(passwordEncoder, "PasswordEncoder Bean 应存在");
        
        // 测试长密码（72 字符是 BCrypt 的最大长度）
        String longPassword = "a".repeat(72);
        String encoded = passwordEncoder.encode(longPassword);
        
        assertNotNull(encoded, "长密码应能编码");
        assertTrue(passwordEncoder.matches(longPassword, encoded), 
                "长密码编码后应能匹配");
    }
}
