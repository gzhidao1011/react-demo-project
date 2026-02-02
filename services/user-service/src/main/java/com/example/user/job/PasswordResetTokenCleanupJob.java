package com.example.user.job;

import com.example.user.mapper.PasswordResetTokenMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 密码重置 Token 过期清理定时任务
 * 每日 03:00 删除 expires_at < NOW() 的记录，避免表膨胀
 */
@Component
public class PasswordResetTokenCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetTokenCleanupJob.class);

    private final PasswordResetTokenMapper tokenMapper;

    public PasswordResetTokenCleanupJob(PasswordResetTokenMapper tokenMapper) {
        this.tokenMapper = tokenMapper;
    }

    /**
     * 每日 03:00 执行过期 Token 清理
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupExpiredTokens() {
        try {
            LocalDateTime now = LocalDateTime.now();
            int deleted = tokenMapper.deleteExpiredBefore(now);
            if (deleted > 0) {
                log.info("密码重置 Token 清理完成，删除 {} 条过期记录", deleted);
            }
        } catch (Exception e) {
            log.error("密码重置 Token 清理失败", e);
        }
    }
}
