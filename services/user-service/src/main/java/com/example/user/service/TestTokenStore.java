package com.example.user.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 测试环境 Token 存储
 * 当 RESEND_API_KEY 为空时，EmailVerificationService 将生成的 token 存入此处，
 * 供集成测试获取验证 token
 */
public final class TestTokenStore {

    private static final Map<String, String> TOKEN_BY_EMAIL = new ConcurrentHashMap<>();
    private static final Map<String, String> PASSWORD_RESET_TOKEN_BY_EMAIL = new ConcurrentHashMap<>();

    private TestTokenStore() {
    }

    /**
     * 存储 token（按邮箱，用于邮箱验证）
     */
    public static void put(String email, String token) {
        TOKEN_BY_EMAIL.put(email, token);
    }

    /**
     * 获取 token（测试用，用于邮箱验证）
     */
    public static String getToken(String email) {
        return TOKEN_BY_EMAIL.get(email);
    }

    /**
     * 存储密码重置 token（按邮箱）
     * 当 RESEND_API_KEY 为空时，PasswordResetService 将 token 存入此处供测试使用
     */
    public static void putPasswordReset(String email, String token) {
        PASSWORD_RESET_TOKEN_BY_EMAIL.put(email, token);
    }

    /**
     * 获取密码重置 token（测试用）
     */
    public static String getPasswordResetToken(String email) {
        return PASSWORD_RESET_TOKEN_BY_EMAIL.get(email);
    }

    /**
     * 清空（测试 setUp 用）
     */
    public static void clear() {
        TOKEN_BY_EMAIL.clear();
        PASSWORD_RESET_TOKEN_BY_EMAIL.clear();
    }
}
