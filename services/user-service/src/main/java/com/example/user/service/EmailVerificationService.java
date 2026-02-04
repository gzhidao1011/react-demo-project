package com.example.user.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.user.entity.EmailVerificationTokenEntity;
import com.example.user.entity.UserEntity;
import com.example.user.mapper.EmailVerificationTokenMapper;
import com.example.user.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

/**
 * 邮箱验证服务
 * 负责生成验证 token、发送验证邮件、验证 token
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private static final int TOKEN_BYTES = 48; // 48 bytes = 64 chars Base64URL
    private static final int TOKEN_EXPIRY_HOURS = 24;
    private static final int RESEND_RATE_LIMIT_PER_USER = 3;
    private static final long RESEND_RATE_LIMIT_WINDOW_SECONDS = 3600;
    private static final String RESEND_RATE_LIMIT_KEY_PREFIX = "rate_limit:resend_verification:user:";

    private final UserMapper userMapper;
    private final EmailVerificationTokenMapper tokenMapper;
    private final RedisTemplate<String, String> redisTemplate;

    public EmailVerificationService(
            UserMapper userMapper,
            EmailVerificationTokenMapper tokenMapper,
            @Qualifier("redisTemplate") RedisTemplate<String, String> redisTemplate) {
        this.userMapper = userMapper;
        this.tokenMapper = tokenMapper;
        this.redisTemplate = redisTemplate;
    }

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from:onboarding@resend.dev}")
    private String resendFrom;

    @Value("${resend.verification-link-base:http://localhost:5573}")
    private String verificationLinkBase;

    /**
     * 生成并发送验证邮件
     *
     * @param userId 用户 ID
     * @param email  用户邮箱
     */
    @Transactional
    public void generateAndSendVerificationEmail(Long userId, String email) {
        // 1. 删除该用户已有的旧 token
        tokenMapper.deleteByUserId(userId);

        // 2. 生成 cryptographically secure 随机 token（64 字符 Base64URL）
        String token = generateSecureToken();

        // 3. 计算 SHA-256 哈希
        String tokenHash = sha256(token);

        // 4. 存储到 DB
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(TOKEN_EXPIRY_HOURS);

        EmailVerificationTokenEntity entity = new EmailVerificationTokenEntity();
        entity.setUserId(userId);
        entity.setTokenHash(tokenHash);
        entity.setExpiresAt(expiresAt);
        entity.setCreatedAt(now);
        tokenMapper.insert(entity);

        // 5. 构建验证链接（仅从配置读取，防 Host Header Injection；含 email 供前端 resend 使用）
        String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
        String verificationUrl = verificationLinkBase + "/verify-email?token=" + token + "&email=" + encodedEmail;

        // 6. 发送邮件或记录日志
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.info("[开发环境] 验证链接（RESEND_API_KEY 为空，未发送邮件）: {}", verificationUrl);
            TestTokenStore.put(email, token);
        } else {
            sendVerificationEmail(email, verificationUrl);
        }
    }

    /**
     * 验证邮箱 token
     *
     * @param token 验证 token
     * @return 验证成功后的用户实体
     */
    @Transactional
    public UserEntity verifyEmail(String token) {
        String tokenHash = sha256(token);

        EmailVerificationTokenEntity tokenEntity = tokenMapper.findByTokenHash(tokenHash);
        if (tokenEntity == null) {
            throw new BusinessException(ResultCode.TOKEN_INVALID);
        }

        if (LocalDateTime.now().isAfter(tokenEntity.getExpiresAt())) {
            tokenMapper.deleteById(tokenEntity.getId());
            throw new BusinessException(ResultCode.TOKEN_EXPIRED);
        }

        UserEntity user = userMapper.findById(tokenEntity.getUserId());
        if (user == null) {
            tokenMapper.deleteById(tokenEntity.getId());
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 更新用户邮箱验证状态
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);

        // 删除已使用的 token
        tokenMapper.deleteById(tokenEntity.getId());

        return user;
    }

    /**
     * 重新发送验证邮件
     * 用户枚举防护：无论邮箱是否存在均返回 200 + 相同成功消息
     *
     * @param email 用户邮箱
     */
    public void resendVerificationEmail(String email) {
        // 1. 限流检查（每用户每小时 3 次）
        String rateLimitKey = RESEND_RATE_LIMIT_KEY_PREFIX + email.toLowerCase();
        Long count = redisTemplate.opsForValue().increment(rateLimitKey);
        if (count != null && count == 1) {
            redisTemplate.expire(rateLimitKey, RESEND_RATE_LIMIT_WINDOW_SECONDS, TimeUnit.SECONDS);
        }
        if (count != null && count > RESEND_RATE_LIMIT_PER_USER) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }

        // 2. 查找用户（不存在也返回成功，用户枚举防护）
        UserEntity user = userMapper.findByEmail(email);
        if (user == null) {
            return;
        }

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return;
        }

        // 3. 重新发送
        generateAndSendVerificationEmail(user.getId(), email);
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

    private void sendVerificationEmail(String to, String verificationUrl) {
        try {
            // 验证 API Key 是否配置
            if (resendApiKey == null || resendApiKey.isBlank()) {
                log.error("RESEND_API_KEY 未配置，无法发送验证邮件");
                throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, "邮件服务未配置");
            }

            Resend resend = new Resend(resendApiKey);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(resendFrom)
                    .to(to)
                    .subject("请验证您的邮箱")
                    .html("<p>请点击以下链接验证您的邮箱：</p><p><a href=\"" + verificationUrl + "\">" + verificationUrl + "</a></p><p>链接 24 小时内有效。</p>")
                    .build();

            resend.emails().send(params);
            log.info("验证邮件已发送: to={}, from={}", to, resendFrom);
        } catch (BusinessException e) {
            // 业务异常直接抛出
            throw e;
        } catch (Exception e) {
            // 记录完整的异常信息，包括堆栈跟踪
            log.error("发送验证邮件失败: to={}, from={}, error={}, message={}", 
                    to, resendFrom, e.getClass().getSimpleName(), e.getMessage(), e);
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, 
                    "发送验证邮件失败: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }
    }
}
