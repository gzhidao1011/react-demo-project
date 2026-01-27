package com.example.user.service;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 密码策略验证服务
 * 符合 NIST 和 OWASP 密码策略建议
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
    
    // 正则表达式模式
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");
    
    /**
     * 验证密码是否符合策略
     * 
     * @param password 待验证的密码
     * @return 验证结果，包含是否通过和错误消息列表
     */
    public PasswordValidationResult validatePassword(String password) {
        List<String> errors = new ArrayList<>();
        
        // 检查长度
        if (password == null || password.length() < minLength) {
            errors.add(String.format("密码长度至少需要 %d 个字符", minLength));
        }
        
        // 检查大写字母
        if (requireUppercase && (password == null || !UPPERCASE_PATTERN.matcher(password).find())) {
            errors.add("密码必须包含至少一个大写字母");
        }
        
        // 检查小写字母
        if (requireLowercase && (password == null || !LOWERCASE_PATTERN.matcher(password).find())) {
            errors.add("密码必须包含至少一个小写字母");
        }
        
        // 检查数字
        if (requireDigit && (password == null || !DIGIT_PATTERN.matcher(password).find())) {
            errors.add("密码必须包含至少一个数字");
        }
        
        // 检查特殊字符
        if (requireSpecial && (password == null || !SPECIAL_PATTERN.matcher(password).find())) {
            errors.add("密码必须包含至少一个特殊字符（!@#$%^&*等）");
        }
        
        boolean isValid = errors.isEmpty();
        String errorMessage = isValid ? null : String.join("；", errors);
        
        return new PasswordValidationResult(isValid, errorMessage, errors);
    }
    
    /**
     * 密码验证结果
     */
    @Data
    public static class PasswordValidationResult {
        private final boolean valid;
        private final String errorMessage;
        private final List<String> errors;
        
        public PasswordValidationResult(boolean valid, String errorMessage, List<String> errors) {
            this.valid = valid;
            this.errorMessage = errorMessage;
            this.errors = errors;
        }
    }
}
