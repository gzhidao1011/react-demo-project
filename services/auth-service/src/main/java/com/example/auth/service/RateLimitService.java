package com.example.auth.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 限流服务：登录、验证邮箱、忘记/重置密码限流
 */
@Service
public class RateLimitService {

    private static final String LOGIN_IP_PREFIX = "rate_limit:login:ip:";
    private static final String LOGIN_USER_PREFIX = "rate_limit:login:user:";
    private static final String VERIFY_EMAIL_IP_PREFIX = "rate_limit:verify_email:ip:";
    private static final String FORGOT_PASSWORD_IP_PREFIX = "rate_limit:forgot_password:ip:";
    private static final String FORGOT_PASSWORD_EMAIL_PREFIX = "rate_limit:forgot_password:email:";
    private static final String RESET_PASSWORD_IP_PREFIX = "rate_limit:reset_password:ip:";

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${rate-limit.login.max-attempts-per-ip:100}")
    private int maxAttemptsPerIp;
    @Value("${rate-limit.login.ip-window-seconds:3600}")
    private long ipWindowSeconds;
    @Value("${rate-limit.login.max-attempts-per-user:5}")
    private int maxAttemptsPerUser;
    @Value("${rate-limit.login.user-window-seconds:900}")
    private long userWindowSeconds;
    @Value("${rate-limit.verify-email.max-attempts-per-ip:10}")
    private int verifyEmailMaxPerIp;
    @Value("${rate-limit.verify-email.ip-window-seconds:3600}")
    private long verifyEmailIpWindowSeconds;
    @Value("${rate-limit.forgot-password.max-attempts-per-ip:5}")
    private int forgotPasswordMaxPerIp;
    @Value("${rate-limit.forgot-password.max-attempts-per-email:3}")
    private int forgotPasswordMaxPerEmail;
    @Value("${rate-limit.forgot-password.ip-window-seconds:3600}")
    private long forgotPasswordIpWindowSeconds;
    @Value("${rate-limit.forgot-password.email-window-seconds:3600}")
    private long forgotPasswordEmailWindowSeconds;
    @Value("${rate-limit.reset-password.max-attempts-per-ip:10}")
    private int resetPasswordMaxPerIp;
    @Value("${rate-limit.reset-password.ip-window-seconds:3600}")
    private long resetPasswordIpWindowSeconds;

    public RateLimitService(@Qualifier("stringRedisTemplate") RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void checkRateLimit(String ipAddress, String userId) {
        String ipKey = LOGIN_IP_PREFIX + ipAddress;
        Long ipCount = redisTemplate.opsForValue().increment(ipKey);
        if (ipCount != null && ipCount == 1) {
            redisTemplate.expire(ipKey, ipWindowSeconds, TimeUnit.SECONDS);
        }
        if (ipCount != null && ipCount > maxAttemptsPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
        if (userId != null && !userId.isEmpty()) {
            String userKey = LOGIN_USER_PREFIX + userId;
            Long userCount = redisTemplate.opsForValue().increment(userKey);
            if (userCount != null && userCount == 1) {
                redisTemplate.expire(userKey, userWindowSeconds, TimeUnit.SECONDS);
            }
            if (userCount != null && userCount > maxAttemptsPerUser) {
                throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
            }
        }
    }

    public void checkRateLimitForVerifyEmail(String ipAddress) {
        String key = VERIFY_EMAIL_IP_PREFIX + ipAddress;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, verifyEmailIpWindowSeconds, TimeUnit.SECONDS);
        }
        if (count != null && count > verifyEmailMaxPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }

    public void checkRateLimitForForgotPassword(String ipAddress, String email) {
        String ipKey = FORGOT_PASSWORD_IP_PREFIX + ipAddress;
        Long ipCount = redisTemplate.opsForValue().increment(ipKey);
        if (ipCount != null && ipCount == 1) {
            redisTemplate.expire(ipKey, forgotPasswordIpWindowSeconds, TimeUnit.SECONDS);
        }
        if (ipCount != null && ipCount > forgotPasswordMaxPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
        String emailKey = FORGOT_PASSWORD_EMAIL_PREFIX + (email != null ? email.toLowerCase() : "");
        Long emailCount = redisTemplate.opsForValue().increment(emailKey);
        if (emailCount != null && emailCount == 1) {
            redisTemplate.expire(emailKey, forgotPasswordEmailWindowSeconds, TimeUnit.SECONDS);
        }
        if (emailCount != null && emailCount > forgotPasswordMaxPerEmail) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }

    public void checkRateLimitForResetPassword(String ipAddress) {
        String key = RESET_PASSWORD_IP_PREFIX + ipAddress;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, resetPasswordIpWindowSeconds, TimeUnit.SECONDS);
        }
        if (count != null && count > resetPasswordMaxPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }
}
