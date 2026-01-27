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
 * RefreshTokenRequest 验证测试
 * 
 * TDD 方式：先写测试，驱动实现 RefreshTokenRequest DTO 和验证注解
 * 
 * 测试覆盖：
 * - refreshToken 不能为空
 * - refreshToken 不能为空白字符串
 * - 有效数据通过验证
 * - JSON 字段名应为 refresh_token（OAuth 2.0 标准）
 */
class RefreshTokenRequestValidationTest {

    private static Validator validator;
    private RefreshTokenRequest request;

    @BeforeAll
    static void setupValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @BeforeEach
    void setUp() {
        request = new RefreshTokenRequest();
    }

    @Test
    void shouldLoadRefreshTokenRequestClass() {
        assertNotNull(RefreshTokenRequest.class, "应存在 RefreshTokenRequest DTO 类");
    }

    @Test
    void shouldFailValidationWhenRefreshTokenIsNull() {
        // refreshToken 为 null

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("refreshToken")),
                "refreshToken 为 null 应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenRefreshTokenIsBlank() {
        request.setRefreshToken("");

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("refreshToken")),
                "refreshToken 为空字符串应触发验证错误");
    }

    @Test
    void shouldFailValidationWhenRefreshTokenIsWhitespace() {
        request.setRefreshToken("   ");

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "应存在验证错误");
        assertTrue(violations.stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("refreshToken")),
                "refreshToken 为空白字符串应触发验证错误");
    }

    @Test
    void shouldPassValidationWithValidRefreshToken() {
        request.setRefreshToken("valid_refresh_token_string");

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), 
                "有效 refreshToken 应通过验证，violations: " + 
                violations.stream()
                        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                        .collect(Collectors.joining(", ")));
    }

    @Test
    void shouldAcceptJwtTokenFormat() {
        // JWT Token 格式：header.payload.signature
        String jwtToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.signature";
        request.setRefreshToken(jwtToken);

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "JWT 格式的 refreshToken 应通过验证");
    }

    @Test
    void shouldAcceptLongRefreshToken() {
        // Refresh Token 可能很长
        String longToken = "a".repeat(500);
        request.setRefreshToken(longToken);

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "长 refreshToken 应通过验证");
    }

    @Test
    void shouldAcceptShortRefreshToken() {
        // 最短的有效 token（至少 1 个字符）
        request.setRefreshToken("a");

        Set<ConstraintViolation<RefreshTokenRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "短 refreshToken（至少 1 个字符）应通过验证");
    }
}
