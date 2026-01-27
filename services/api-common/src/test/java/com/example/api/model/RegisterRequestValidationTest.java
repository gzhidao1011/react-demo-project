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
 * RegisterRequest 验证测试
 * 
 * TDD 方式：先写测试，驱动实现 RegisterRequest DTO 和验证注解
 * 
 * 测试覆盖：
 * - 邮箱不能为空
 * - 邮箱格式验证
 * - 密码不能为空
 * - 密码长度验证（最少 8 个字符，最多 128 个字符）
 * - 有效数据通过验证
 */
class RegisterRequestValidationTest {

    private static Validator validator;
    private RegisterRequest request;

    @BeforeAll
    static void setupValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @BeforeEach
    void setUp() {
        request = new RegisterRequest();
    }

    @Test
    void shouldLoadRegisterRequestClass() {
        assertNotNull(RegisterRequest.class, "应存在 RegisterRequest DTO 类");
    }

    @Test
    void shouldFailValidationWhenEmailIsNull() {
        // email 为 null
        request.setPassword("validPassword123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("email")),
                "email 为 null 应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenEmailIsBlank() {
        request.setEmail("");
        request.setPassword("validPassword123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("email")),
                "email 为空字符串应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenEmailIsInvalid() {
        request.setEmail("invalid-email");
        request.setPassword("validPassword123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

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

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
                "password 为 null 应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenPasswordIsBlank() {
        request.setEmail("test@example.com");
        request.setPassword("");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
                "password 为空字符串应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenPasswordTooShort() {
        request.setEmail("test@example.com");
        request.setPassword("short"); // 少于 8 个字符

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("password")
                                && v.getMessage().contains("8")),
                "密码长度少于 8 个字符应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenPasswordTooLong() {
        request.setEmail("test@example.com");
        request.setPassword("a".repeat(129)); // 超过 128 个字符

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("password")
                                && v.getMessage().contains("128")),
                "密码长度超过 128 个字符应触发验证错误");
    }

    @Test
    void shouldPassValidationWithValidData() {
        request.setEmail("test@example.com");
        request.setPassword("validPassword123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), 
                "有效数据应通过验证，violations: " + 
                violations.stream()
                        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                        .collect(Collectors.joining(", ")));
    }

    @Test
    void shouldPassValidationWithMinimumLengthPassword() {
        request.setEmail("test@example.com");
        request.setPassword("12345678"); // 正好 8 个字符

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "8 个字符的密码应通过验证");
    }

    @Test
    void shouldPassValidationWithMaximumLengthPassword() {
        request.setEmail("test@example.com");
        request.setPassword("a".repeat(128)); // 正好 128 个字符

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "128 个字符的密码应通过验证");
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
            request.setPassword("validPassword123");

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

            assertTrue(violations.isEmpty(), 
                    "有效邮箱格式应通过验证: " + email);
        }
    }

    @Test
    void shouldHandleConfirmPasswordField() {
        // confirmPassword 是可选的，不应影响验证
        request.setEmail("test@example.com");
        request.setPassword("validPassword123");
        request.setConfirmPassword("validPassword123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), 
                "confirmPassword 字段不应影响验证（由前端验证）");
    }
}
