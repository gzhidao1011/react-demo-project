package com.example.auth.service;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Token 轮换服务：Refresh Token 存储、验证、轮换与重用检测
 */
@Service
public class TokenRotationService {

    private static final String REFRESH_TOKEN_KEY_PREFIX = "refresh_token:";
    private static final String BLACKLIST_KEY_PREFIX = "blacklist:";

    private final RedisTemplate<String, String> redisTemplate;
    private final JwtService jwtService;

    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;

    public TokenRotationService(
            @Qualifier("stringRedisTemplate") RedisTemplate<String, String> redisTemplate,
            JwtService jwtService) {
        this.redisTemplate = redisTemplate;
        this.jwtService = jwtService;
    }

    public void storeRefreshToken(String userId, String deviceId, String refreshToken) {
        String key = buildKey(userId, deviceId);
        redisTemplate.opsForValue().set(key, refreshToken, refreshTokenExpiration, TimeUnit.SECONDS);
    }

    public boolean validateRefreshToken(String userId, String deviceId, String refreshToken) {
        if (isTokenBlacklisted(refreshToken)) {
            return false;
        }
        String key = buildKey(userId, deviceId);
        String stored = redisTemplate.opsForValue().get(key);
        return stored != null && stored.equals(refreshToken);
    }

    public void markTokenAsUsed(String userId, String deviceId, String oldRefreshToken) {
        addToBlacklist(oldRefreshToken);
        redisTemplate.delete(buildKey(userId, deviceId));
    }

    public void revokeToken(String refreshToken) {
        addToBlacklist(refreshToken);
        try {
            Claims claims = jwtService.parseToken(refreshToken);
            String userId = claims.getSubject();
            String deviceId = claims.get("deviceId", String.class);
            redisTemplate.delete(buildKey(userId, deviceId));
        } catch (Exception ignored) {
        }
    }

    public void revokeAllByUserId(String userId) {
        Set<String> keys = redisTemplate.keys(REFRESH_TOKEN_KEY_PREFIX + userId + "*");
        if (keys != null) {
            for (String key : keys) {
                String token = redisTemplate.opsForValue().get(key);
                if (token != null && !token.isEmpty()) {
                    addToBlacklist(token);
                }
                redisTemplate.delete(key);
            }
        }
    }

    public boolean checkTokenReuse(String refreshToken) {
        return isTokenBlacklisted(refreshToken);
    }

    private void addToBlacklist(String refreshToken) {
        redisTemplate.opsForValue().set(BLACKLIST_KEY_PREFIX + refreshToken, "revoked", refreshTokenExpiration, TimeUnit.SECONDS);
    }

    private boolean isTokenBlacklisted(String refreshToken) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_KEY_PREFIX + refreshToken));
    }

    private static String buildKey(String userId, String deviceId) {
        if (deviceId != null && !deviceId.isEmpty()) {
            return REFRESH_TOKEN_KEY_PREFIX + userId + ":" + deviceId;
        }
        return REFRESH_TOKEN_KEY_PREFIX + userId;
    }
}
