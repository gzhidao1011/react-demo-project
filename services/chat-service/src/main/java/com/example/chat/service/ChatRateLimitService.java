package com.example.chat.service;

/**
 * Chat 限流服务
 * 按用户 ID 限制请求频率，防止滥用
 */
public interface ChatRateLimitService {

    /**
     * 检查限流
     * 若超过限制则抛出 BusinessException(RATE_LIMIT_EXCEEDED)
     *
     * @param userId 用户 ID（来自 JWT）
     */
    void checkRateLimit(String userId);
}
