package com.example.chat.service.impl;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.chat.service.ChatRateLimitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Chat 限流服务实现（内存版）
 * 固定窗口：每用户每窗口内最多 N 次请求
 * 注：多实例部署时需改用 Redis 等分布式限流
 */
@Service
public class ChatRateLimitServiceImpl implements ChatRateLimitService {

    @Value("${chat.rate-limit.max-requests-per-minute:30}")
    private int maxRequestsPerMinute;

    @Value("${chat.rate-limit.window-seconds:60}")
    private long windowSeconds;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    public void checkRateLimit(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        long now = System.currentTimeMillis();
        Window w = windows.compute(userId, (k, v) -> {
            if (v == null || now - v.startMs > windowSeconds * 1000) {
                return new Window(now, new AtomicInteger(1));
            }
            v.count.incrementAndGet();
            return v;
        });
        if (w.count.get() > maxRequestsPerMinute) {
            throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
        }
    }

    private static class Window {
        final long startMs;
        final AtomicInteger count;

        Window(long startMs, AtomicInteger count) {
            this.startMs = startMs;
            this.count = count;
        }
    }
}
