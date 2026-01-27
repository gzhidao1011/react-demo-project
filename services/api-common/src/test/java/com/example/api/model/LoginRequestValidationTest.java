package com.example.api.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LoginRequest 验证测试
 * 
 * TDD 方式：先写测试，驱动实现 LoginRequest DTO 和验证注解
 * 
 * 测试覆盖：
 * - 邮箱不能为空
 * - 邮箱格式验证
 * - 密码不能为空
 * - rememberMe 字段可选（默认 false）
 * - 有效数据通过验证
 */
class LoginRequestValidationTest {

    private static Validator validator;
    private LoginRequest request;

    @BeforeAll
    static void setupValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @BeforeEach
    void setUp() {
        request = new LoginRequest();
    }

    @Test
    void shouldLoadLoginRequestClass() {
        assertNotNull(LoginRequest.class, "应存在 LoginRequest DTO 类");
    }

    @Test
    void shouldFailValidationWhenEmailIsNull() {
        // email 为 null
        request.setPassword("password123");

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("email")),
                "email 为 null 应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenEmailIsBlank() {
        request.setEmail("");
        request.setPassword("password123");

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("email")),
                "email 为空字符串应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenEmailIsInvalid() {
        request.setEmail("invalid-email");
        request.setPassword("password123");

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("email")
                                && v.getMessage().contains("有效的邮箱地址")),
                "无效邮箱格式应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenPasswordIsNull() {
        request.setEmail("test@example.com");
        // password 为 null

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
                "password 为 null 应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenPasswordIsBlank() {
        request.setEmail("test@example.com");
        request.setPassword("");

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
                "password 为空字符串应触发验证错误");
    }

    @Test
    void shouldPassValidationWithValidData() {
        request.setEmail("test@example.com");
        request.setPassword("password123");

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), 
                "有效数据应通过验证，violations: " + 
                violations.stream()
                        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                        .collect(Collectors.joining(", ")));
    }

    @Test
    void shouldHaveRememberMeDefaultValue() {
        // rememberMe 字段应该有默认值 false
        assertNotNull(request.getRememberMe(), "rememberMe 字段不应为 null");
        assertEquals(false, request.getRememberMe(), 
                "rememberMe 默认值应为 false");
    }

    @Test
    void shouldAcceptRememberMeTrue() {
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRememberMe(true);

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "rememberMe 为 true 时应通过验证");
        assertTrue(request.getRememberMe(), "rememberMe 应能设置为 true");
    }

    @Test
    void shouldAcceptRememberMeFalse() {
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRememberMe(false);

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "rememberMe 为 false 时应通过验证");
        assertFalse(request.getRememberMe(), "rememberMe 应能设置为 false");
    }

    @Test
    void shouldPassValidationWithVariousValidEmailFormats() {
        String[] validEmails = {
            "test@example.com",
            "user.name@example.com",
            "user+tag@example.co.uk",
            "user123@example-domain.com"
        };

        for (String email : validEmails) {
            request.setEmail(email);
            request.setPassword("password123");

            Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

            assertTrue(violations.isEmpty(), 
                    "有效邮箱格式应通过验证: " + email);
        }
    }

    @Test
    void shouldAcceptAnyPasswordLength() {
        // LoginRequest 的 password 没有长度限制（与 RegisterRequest 不同）
        String[] passwords = {
            "short",
            "normalPassword123",
            "veryLongPasswordThatExceedsNormalLengthButIsStillValidForLogin123456789"
        };

        for (String password : passwords) {
            request.setEmail("test@example.com");
            request.setPassword(password);

            Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

            // 注意：如果实现中添加了长度限制，此测试可能需要调整
            // 当前假设登录密码没有长度限制（仅不能为空）
            assertTrue(violations.isEmpty() || 
                    violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("password")),
                    "任何长度的密码（非空）应通过验证: " + password);
        }
    }
}
