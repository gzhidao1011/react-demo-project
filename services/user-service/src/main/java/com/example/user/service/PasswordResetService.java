package com.example.user.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.ForgotPasswordResponse;
import com.example.user.entity.PasswordResetTokenEntity;
import com.example.user.entity.UserEntity;
import com.example.user.mapper.PasswordResetTokenMapper;
import com.example.user.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * 密码重置服务
 * 负责忘记密码、重置密码、发送重置邮件
 * 遵循 OWASP 安全实践：用户枚举防护、响应时间一致性、Token 单次使用
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private static final int TOKEN_BYTES = 48; // 48 bytes = 64 chars Base64URL
    private static final String SUCCESS_MESSAGE = "如果该邮箱已注册，您将收到重置链接";

    private final UserMapper userMapper;
    private final PasswordResetTokenMapper tokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from:onboarding@resend.dev}")
    private String resendFrom;

    @Value("${resend.verification-link-base:http://localhost:5573}")
    private String verificationLinkBase;

    @Value("${password-reset.token-expiry-minutes:60}")
    private int tokenExpiryMinutes;

    public PasswordResetService(
            UserMapper userMapper,
            PasswordResetTokenMapper tokenMapper,
            PasswordEncoder passwordEncoder,
            PasswordPolicyService passwordPolicyService) {
        this.userMapper = userMapper;
        this.tokenMapper = tokenMapper;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
    }

    /**
     * 忘记密码
     * 用户枚举防护：无论邮箱是否存在均返回 200 + 相同成功消息
     * 响应时间一致性：无论邮箱是否存在执行相同逻辑路径
     *
     * @param email 用户邮箱（已 trim、toLowerCase 标准化）
     * @return 统一成功响应
     */
    @Transactional
    public ForgotPasswordResponse forgotPassword(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        UserEntity user = userMapper.findByEmail(normalizedEmail);

        if (user != null) {
            // 删除该用户已有的旧 token
            tokenMapper.deleteByUserId(user.getId());

            // 生成 cryptographically secure 随机 token（64 字符 Base64URL）
            String token = generateSecureToken();
            String tokenHash = sha256(token);

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiresAt = now.plusMinutes(tokenExpiryMinutes);

            PasswordResetTokenEntity entity = new PasswordResetTokenEntity();
            entity.setUserId(user.getId());
            entity.setTokenHash(tokenHash);
            entity.setExpiresAt(expiresAt);
            entity.setCreatedAt(now);
            tokenMapper.insert(entity);

            String encodedEmail = URLEncoder.encode(normalizedEmail, StandardCharsets.UTF_8);
            String resetUrl = verificationLinkBase + "/reset-password?token=" + token + "&email=" + encodedEmail;

            if (resendApiKey == null || resendApiKey.isBlank()) {
                log.info("[开发环境] 密码重置链接（RESEND_API_KEY 为空，未发送邮件）: {}", resetUrl);
                TestTokenStore.putPasswordReset(normalizedEmail, token);
            } else {
                sendResetEmail(normalizedEmail, resetUrl);
            }
        }
        // 用户不存在也返回成功（用户枚举防护）
        return ForgotPasswordResponse.builder()
                .message(SUCCESS_MESSAGE)
                .build();
    }

    /**
     * 重置密码
     * 校验 token、更新密码、删除 token、撤销 Refresh Token、发送确认邮件
     *
     * @param token 重置 token
     * @param newPassword 新密码
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        String tokenHash = sha256(token);

        PasswordResetTokenEntity tokenEntity = tokenMapper.findByTokenHash(tokenHash);
        if (tokenEntity == null) {
            throw new BusinessException(ResultCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        if (LocalDateTime.now().isAfter(tokenEntity.getExpiresAt())) {
            tokenMapper.deleteById(tokenEntity.getId());
            throw new BusinessException(ResultCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        UserEntity user = userMapper.findById(tokenEntity.getUserId());
        if (user == null) {
            tokenMapper.deleteById(tokenEntity.getId());
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 密码策略校验
        PasswordPolicyService.PasswordValidationResult validationResult =
                passwordPolicyService.validatePassword(newPassword);
        if (!validationResult.isValid()) {
            throw new BusinessException(ResultCode.PASSWORD_POLICY_VIOLATION, validationResult.getErrorMessage());
        }

        // 更新密码
        LocalDateTime now = LocalDateTime.now();
        userMapper.updatePassword(user.getId(), passwordEncoder.encode(newPassword), now);

        // 删除已使用的 token
        tokenMapper.deleteById(tokenEntity.getId());

        // 注意：Refresh Token 撤销由 auth-service 在重置密码流程中执行

        // 发送确认邮件（不含新密码）
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendPasswordResetConfirmationEmail(user.getEmail());
        } else {
            log.info("[开发环境] 密码已重置（RESEND_API_KEY 为空，未发送确认邮件）: {}", maskEmail(user.getEmail()));
        }
    }

    /**
     * 校验密码重置 token 并一次性消费（供 auth-service 内部 API 调用）
     * 校验成功后删除 token，返回 userId；auth-service 再调用 updatePassword 并 revokeAllByUserId
     *
     * @param token 重置 token
     * @return 用户 ID
     */
    @Transactional
    public Long validateTokenAndConsume(String token) {
        String tokenHash = sha256(token);

        PasswordResetTokenEntity tokenEntity = tokenMapper.findByTokenHash(tokenHash);
        if (tokenEntity == null) {
            throw new BusinessException(ResultCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        if (LocalDateTime.now().isAfter(tokenEntity.getExpiresAt())) {
            tokenMapper.deleteById(tokenEntity.getId());
            throw new BusinessException(ResultCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        Long userId = tokenEntity.getUserId();
        tokenMapper.deleteById(tokenEntity.getId());
        return userId;
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 不可用", e);
        }
    }

    private void sendResetEmail(String to, String resetUrl) {
        try {
            com.resend.Resend resend = new com.resend.Resend(resendApiKey);
            String expiryText = tokenExpiryMinutes <= 60
                    ? "此链接 " + tokenExpiryMinutes + " 分钟内有效"
                    : "此链接 " + (tokenExpiryMinutes / 60) + " 小时内有效";

            com.resend.services.emails.model.CreateEmailOptions params =
                    com.resend.services.emails.model.CreateEmailOptions.builder()
                            .from(resendFrom)
                            .to(to)
                            .subject("重置您的密码")
                            .html("<p>请点击以下链接重置您的密码：</p><p><a href=\"" + resetUrl + "\">" + resetUrl + "</a></p><p>" + expiryText + "。</p>")
                            .build();

            resend.emails().send(params);
        } catch (Exception e) {
            log.error("发送密码重置邮件失败: {}", e.getMessage());
            // 不抛出异常，用户枚举防护：失败也返回 200
        }
    }

    private void sendPasswordResetConfirmationEmail(String to) {
        try {
            com.resend.Resend resend = new com.resend.Resend(resendApiKey);

            com.resend.services.emails.model.CreateEmailOptions params =
                    com.resend.services.emails.model.CreateEmailOptions.builder()
                            .from(resendFrom)
                            .to(to)
                            .subject("您的密码已重置")
                            .html("<p>您的密码已成功重置。</p><p>若非本人操作，请立即联系支持。</p>")
                            .build();

            resend.emails().send(params);
        } catch (Exception e) {
            log.error("发送密码重置确认邮件失败: {}", e.getMessage());
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.isEmpty()) return "***";
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) return "***";
        return email.charAt(0) + "***" + email.substring(atIndex);
    }
}
