package com.example.user.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PasswordPolicyService 单元测试
 *
 * 测试覆盖：
 * - 符合策略的密码通过验证
 * - 弱密码（过短、缺少大写/小写/数字/特殊字符）被拒绝
 * - 错误消息清晰
 */
@SpringBootTest(classes = PasswordPolicyService.class)
@TestPropertySource(properties = {
    "password.min-length=8",
    "password.require-uppercase=true",
    "password.require-lowercase=true",
    "password.require-digit=true",
    "password.require-special=true"
})
class PasswordPolicyServiceTest {

    @Autowired
    private PasswordPolicyService passwordPolicyService;

    @Test
    void testValidPassword() {
        String password = "Password123!";
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertTrue(result.isValid());
        assertNull(result.getErrorMessage());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void testWeakPasswordTooShort() {
        String password = "weak";
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertFalse(result.isValid());
        assertNotNull(result.getErrorMessage());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().stream().anyMatch(s -> s.contains("长度")));
    }

    @Test
    void testWeakPasswordNoUppercase() {
        String password = "password123!";
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(s -> s.contains("大写")));
    }

    @Test
    void testWeakPasswordNoLowercase() {
        String password = "PASSWORD123!";
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(s -> s.contains("小写")));
    }

    @Test
    void testWeakPasswordNoDigit() {
        String password = "Password!!";
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(s -> s.contains("数字")));
    }

    @Test
    void testWeakPasswordNoSpecialChar() {
        String password = "Password123";
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(password);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(s -> s.contains("特殊字符")));
    }

    @Test
    void testNullPassword() {
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword(null);
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    void testEmptyPassword() {
        PasswordPolicyService.PasswordValidationResult result = passwordPolicyService.validatePassword("");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(s -> s.contains("长度")));
    }
}
