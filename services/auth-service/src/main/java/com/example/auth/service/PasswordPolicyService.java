package com.example.auth.service;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 密码策略验证服务（与 user-service 一致）
 */
@Service
public class PasswordPolicyService {

    @Value("${password.min-length:8}")
    private int minLength;
    @Value("${password.require-uppercase:true}")
    private boolean requireUppercase;
    @Value("${password.require-lowercase:true}")
    private boolean requireLowercase;
    @Value("${password.require-digit:true}")
    private boolean requireDigit;
    @Value("${password.require-special:true}")
    private boolean requireSpecial;

    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    public PasswordValidationResult validatePassword(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null || password.length() < minLength) {
            errors.add("密码长度至少需要 " + minLength + " 个字符");
        }
        if (requireUppercase && (password == null || !UPPERCASE.matcher(password).find())) {
            errors.add("密码必须包含至少一个大写字母");
        }
        if (requireLowercase && (password == null || !LOWERCASE.matcher(password).find())) {
            errors.add("密码必须包含至少一个小写字母");
        }
        if (requireDigit && (password == null || !DIGIT.matcher(password).find())) {
            errors.add("密码必须包含至少一个数字");
        }
        if (requireSpecial && (password == null || !SPECIAL.matcher(password).find())) {
            errors.add("密码必须包含至少一个特殊字符");
        }
        boolean valid = errors.isEmpty();
        return new PasswordValidationResult(valid, valid ? null : String.join("；", errors), errors);
    }

    @Data
    public static class PasswordValidationResult {
        private final boolean valid;
        private final String errorMessage;
        private final List<String> errors;
    }
}
