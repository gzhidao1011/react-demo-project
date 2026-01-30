package com.example.chat.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ChatRateLimitService 单元测试（TDD）
 * 验证：限流逻辑、超限抛出 429
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "chat.rate-limit.max-requests-per-minute=2",
    "chat.rate-limit.window-seconds=60"
})
class ChatRateLimitServiceTest {

    @Autowired
    private ChatRateLimitService chatRateLimitService;

    @Test
    void shouldAllowRequestsWithinLimit() {
        String userId = "user_limit_ok";
        assertDoesNotThrow(() -> chatRateLimitService.checkRateLimit(userId));
        assertDoesNotThrow(() -> chatRateLimitService.checkRateLimit(userId));
    }

    @Test
    void shouldThrowWhenRateLimitExceeded() {
        String userId = "user_limit_exceed";
        chatRateLimitService.checkRateLimit(userId);
        chatRateLimitService.checkRateLimit(userId);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> chatRateLimitService.checkRateLimit(userId));
        assertEquals(ResultCode.RATE_LIMIT_EXCEEDED.getCode(), ex.getCode());
    }

    @Test
    void shouldNotLimitWhenUserIdBlank() {
        assertDoesNotThrow(() -> chatRateLimitService.checkRateLimit(null));
        assertDoesNotThrow(() -> chatRateLimitService.checkRateLimit(""));
    }
}
