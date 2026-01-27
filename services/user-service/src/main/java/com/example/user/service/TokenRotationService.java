package com.example.user.service;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Token 轮换服务
 * 负责 Refresh Token 的存储、验证、轮换和重用检测
 * 
 * 参考：Auth0 Refresh Token Rotation
 * https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation
 */
@Service
@RequiredArgsConstructor
public class TokenRotationService {
    
    private final RedisTemplate<String, String> redisTemplate;
    private final JwtService jwtService;
    
    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;
    
    /**
     * Refresh Token Key 前缀
     */
    private static final String REFRESH_TOKEN_KEY_PREFIX = "refresh_token:";
    
    /**
     * Token 黑名单 Key 前缀
     */
    private static final String BLACKLIST_KEY_PREFIX = "blacklist:";
    
    /**
     * 存储 Refresh Token 到 Redis
     * 
     * @param userId 用户ID
     * @param deviceId 设备ID（可选）
     * @param refreshToken Refresh Token 字符串
     */
    public void storeRefreshToken(String userId, String deviceId, String refreshToken) {
        String key = buildRefreshTokenKey(userId, deviceId);
        // 存储 Token，过期时间与 Token 有效期一致
        redisTemplate.opsForValue().set(key, refreshToken, refreshTokenExpiration, TimeUnit.SECONDS);
    }
    
    /**
     * 验证 Refresh Token 是否有效
     * 
     * @param userId 用户ID
     * @param deviceId 设备ID（可选）
     * @param refreshToken Refresh Token 字符串
     * @return true 如果 Token 有效，false 否则
     */
    public boolean validateRefreshToken(String userId, String deviceId, String refreshToken) {
        // 1. 检查 Token 是否在黑名单中
        if (isTokenBlacklisted(refreshToken)) {
            return false;
        }
        
        // 2. 检查 Token 是否在 Redis 中（已存储的有效 Token）
        String key = buildRefreshTokenKey(userId, deviceId);
        String storedToken = redisTemplate.opsForValue().get(key);
        
        // 如果 Redis 中没有存储，说明是首次使用或已过期
        if (storedToken == null) {
            return false;
        }
        
        // 3. 验证 Token 是否匹配
        return storedToken.equals(refreshToken);
    }
    
    /**
     * 标记 Token 已使用（用于 Token 轮换）
     * 将旧 Token 加入黑名单，删除 Redis 中的旧 Token
     * 
     * @param userId 用户ID
     * @param deviceId 设备ID（可选）
     * @param oldRefreshToken 旧的 Refresh Token
     */
    public void markTokenAsUsed(String userId, String deviceId, String oldRefreshToken) {
        // 1. 将旧 Token 加入黑名单
        addToBlacklist(oldRefreshToken);
        
        // 2. 删除 Redis 中的旧 Token
        String key = buildRefreshTokenKey(userId, deviceId);
        redisTemplate.delete(key);
    }
    
    /**
     * 撤销 Token（加入黑名单）
     * 用于登出时撤销所有 Token
     * 
     * @param refreshToken Refresh Token 字符串
     */
    public void revokeToken(String refreshToken) {
        addToBlacklist(refreshToken);
        
        // 尝试从 Token 中提取用户ID和设备ID，删除 Redis 中的 Token
        try {
            Claims claims = jwtService.parseToken(refreshToken);
            String userId = claims.getSubject();
            String deviceId = claims.get("deviceId", String.class);
            
            String key = buildRefreshTokenKey(userId, deviceId);
            redisTemplate.delete(key);
        } catch (Exception e) {
            // 如果解析失败，只加入黑名单即可
        }
    }
    
    /**
     * 检测 Token 重用
     * 如果旧 Token 被重用（已加入黑名单），说明可能存在安全风险
     * 
     * @param refreshToken Refresh Token 字符串
     * @return true 如果检测到重用，false 否则
     */
    public boolean checkTokenReuse(String refreshToken) {
        return isTokenBlacklisted(refreshToken);
    }
    
    /**
     * 将 Token 加入黑名单
     * 
     * @param refreshToken Refresh Token 字符串
     */
    private void addToBlacklist(String refreshToken) {
        String key = BLACKLIST_KEY_PREFIX + refreshToken;
        // 黑名单过期时间与 Refresh Token 有效期一致
        redisTemplate.opsForValue().set(key, "revoked", refreshTokenExpiration, TimeUnit.SECONDS);
    }
    
    /**
     * 检查 Token 是否在黑名单中
     * 
     * @param refreshToken Refresh Token 字符串
     * @return true 如果在黑名单中，false 否则
     */
    private boolean isTokenBlacklisted(String refreshToken) {
        String key = BLACKLIST_KEY_PREFIX + refreshToken;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    /**
     * 构建 Refresh Token 的 Redis Key
     * 
     * @param userId 用户ID
     * @param deviceId 设备ID（可选）
     * @return Redis Key
     */
    private String buildRefreshTokenKey(String userId, String deviceId) {
        if (deviceId != null && !deviceId.isEmpty()) {
            return REFRESH_TOKEN_KEY_PREFIX + userId + ":" + deviceId;
        }
        return REFRESH_TOKEN_KEY_PREFIX + userId;
    }
}
