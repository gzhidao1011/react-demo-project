package com.example.user.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 限流服务
 * 实现基于 Redis 的限流功能，防止恶意攻击和滥用
 * 
 * 限流策略：
 * - IP 限流：每 IP 每小时最多 100 次登录尝试
 * - 用户限流：每用户每 15 分钟最多 5 次登录尝试
 */
@Service
public class RateLimitService {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    /**
     * 构造函数注入，使用 redisTemplate Bean（与 TokenRotationService 保持一致，使用自定义配置的 Bean）
     */
    public RateLimitService(
            @Qualifier("redisTemplate") RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * IP 限流配置
     */
    @Value("${rate-limit.login.max-attempts-per-ip:100}")
    private int maxAttemptsPerIp;
    
    @Value("${rate-limit.login.ip-window-seconds:3600}")
    private long ipWindowSeconds;
    
    /**
     * 用户限流配置
     */
    @Value("${rate-limit.login.max-attempts-per-user:5}")
    private int maxAttemptsPerUser;
    
    @Value("${rate-limit.login.user-window-seconds:900}")
    private long userWindowSeconds;
    
    /**
     * 验证邮箱接口限流配置（防暴力枚举 token）
     */
    @Value("${rate-limit.verify-email.max-attempts-per-ip:10}")
    private int verifyEmailMaxAttemptsPerIp;
    
    @Value("${rate-limit.verify-email.ip-window-seconds:3600}")
    private long verifyEmailIpWindowSeconds;
    
    /**
     * 忘记密码接口限流配置（防暴力枚举邮箱）
     */
    @Value("${rate-limit.forgot-password.max-attempts-per-ip:5}")
    private int forgotPasswordMaxAttemptsPerIp;
    
    @Value("${rate-limit.forgot-password.max-attempts-per-email:3}")
    private int forgotPasswordMaxAttemptsPerEmail;
    
    @Value("${rate-limit.forgot-password.ip-window-seconds:3600}")
    private long forgotPasswordIpWindowSeconds;
    
    @Value("${rate-limit.forgot-password.email-window-seconds:3600}")
    private long forgotPasswordEmailWindowSeconds;
    
    /**
     * 重置密码接口限流配置（防暴力枚举 token）
     */
    @Value("${rate-limit.reset-password.max-attempts-per-ip:10}")
    private int resetPasswordMaxAttemptsPerIp;
    
    @Value("${rate-limit.reset-password.ip-window-seconds:3600}")
    private long resetPasswordIpWindowSeconds;
    
    /**
     * IP 限流 Key 前缀
     */
    private static final String IP_RATE_LIMIT_KEY_PREFIX = "rate_limit:login:ip:";
    
    /**
     * 用户限流 Key 前缀
     */
    private static final String USER_RATE_LIMIT_KEY_PREFIX = "rate_limit:login:user:";
    
    /**
     * 验证邮箱接口 IP 限流 Key 前缀
     */
    private static final String VERIFY_EMAIL_IP_KEY_PREFIX = "rate_limit:verify_email:ip:";
    
    /**
     * 忘记密码接口限流 Key 前缀
     */
    private static final String FORGOT_PASSWORD_IP_KEY_PREFIX = "rate_limit:forgot_password:ip:";
    private static final String FORGOT_PASSWORD_EMAIL_KEY_PREFIX = "rate_limit:forgot_password:email:";
    
    /**
     * 重置密码接口 IP 限流 Key 前缀
     */
    private static final String RESET_PASSWORD_IP_KEY_PREFIX = "rate_limit:reset_password:ip:";
    
    /**
     * 检查限流
     * 如果超过限流，抛出 RATE_LIMIT_EXCEEDED 异常
     * 
     * @param ipAddress IP 地址
     * @param userId 用户ID（可选，如果为 null 则只检查 IP 限流）
     */
    public void checkRateLimit(String ipAddress, String userId) {
        // 1. 检查 IP 限流
        String ipKey = IP_RATE_LIMIT_KEY_PREFIX + ipAddress;
        Long ipCount = redisTemplate.opsForValue().increment(ipKey);
        
        // 如果是第一次访问，设置过期时间
        if (ipCount != null && ipCount == 1) {
            redisTemplate.expire(ipKey, ipWindowSeconds, TimeUnit.SECONDS);
        }
        
        // 检查是否超过 IP 限流
        if (ipCount != null && ipCount > maxAttemptsPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
        
        // 2. 检查用户限流（如果提供了 userId）
        if (userId != null && !userId.isEmpty()) {
            String userKey = USER_RATE_LIMIT_KEY_PREFIX + userId;
            Long userCount = redisTemplate.opsForValue().increment(userKey);
            
            // 如果是第一次访问，设置过期时间
            if (userCount != null && userCount == 1) {
                redisTemplate.expire(userKey, userWindowSeconds, TimeUnit.SECONDS);
            }
            
            // 检查是否超过用户限流
            if (userCount != null && userCount > maxAttemptsPerUser) {
                throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
            }
        }
    }
    
    /**
     * 检查验证邮箱接口限流（每 IP 每小时最多 N 次，防暴力枚举 token）
     * 
     * @param ipAddress IP 地址
     */
    public void checkRateLimitForVerifyEmail(String ipAddress) {
        String ipKey = VERIFY_EMAIL_IP_KEY_PREFIX + ipAddress;
        Long ipCount = redisTemplate.opsForValue().increment(ipKey);
        
        if (ipCount != null && ipCount == 1) {
            redisTemplate.expire(ipKey, verifyEmailIpWindowSeconds, TimeUnit.SECONDS);
        }
        
        if (ipCount != null && ipCount > verifyEmailMaxAttemptsPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }
    
    /**
     * 检查忘记密码接口限流（每 IP 每小时 N 次、每邮箱每小时 M 次，防暴力枚举邮箱）
     *
     * @param ipAddress IP 地址
     * @param email 邮箱地址
     */
    public void checkRateLimitForForgotPassword(String ipAddress, String email) {
        String ipKey = FORGOT_PASSWORD_IP_KEY_PREFIX + ipAddress;
        Long ipCount = redisTemplate.opsForValue().increment(ipKey);
        if (ipCount != null && ipCount == 1) {
            redisTemplate.expire(ipKey, forgotPasswordIpWindowSeconds, TimeUnit.SECONDS);
        }
        if (ipCount != null && ipCount > forgotPasswordMaxAttemptsPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
        
        String emailKey = FORGOT_PASSWORD_EMAIL_KEY_PREFIX + (email != null ? email.toLowerCase() : "");
        Long emailCount = redisTemplate.opsForValue().increment(emailKey);
        if (emailCount != null && emailCount == 1) {
            redisTemplate.expire(emailKey, forgotPasswordEmailWindowSeconds, TimeUnit.SECONDS);
        }
        if (emailCount != null && emailCount > forgotPasswordMaxAttemptsPerEmail) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }
    
    /**
     * 检查重置密码接口限流（每 IP 每小时 N 次，防暴力枚举 token）
     *
     * @param ipAddress IP 地址
     */
    public void checkRateLimitForResetPassword(String ipAddress) {
        String ipKey = RESET_PASSWORD_IP_KEY_PREFIX + ipAddress;
        Long ipCount = redisTemplate.opsForValue().increment(ipKey);
        if (ipCount != null && ipCount == 1) {
            redisTemplate.expire(ipKey, resetPasswordIpWindowSeconds, TimeUnit.SECONDS);
        }
        if (ipCount != null && ipCount > resetPasswordMaxAttemptsPerIp) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }
    
    /**
     * 增加限流计数（用于登录失败时增加计数）
     * 
     * @param ipAddress IP 地址
     * @param userId 用户ID（可选）
     */
    public void incrementRateLimit(String ipAddress, String userId) {
        // IP 限流计数已在 checkRateLimit 中处理，这里只需要处理用户限流
        if (userId != null && !userId.isEmpty()) {
            String userKey = USER_RATE_LIMIT_KEY_PREFIX + userId;
            Long userCount = redisTemplate.opsForValue().increment(userKey);
            
            // 如果是第一次访问，设置过期时间
            if (userCount != null && userCount == 1) {
                redisTemplate.expire(userKey, userWindowSeconds, TimeUnit.SECONDS);
            }
        }
    }
}
