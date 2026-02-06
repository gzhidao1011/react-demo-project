package com.example.auth.event;

import com.example.api.event.UserCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * 用户事件监听器 - Auth Service
 * 监听用户创建事件，执行相关初始化操作
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventListener {

    /**
     * 处理用户创建事件
     * - 初始化用户认证配置
     * - 发送欢迎邮件（如果需要）
     */
    @KafkaListener(
            topics = "${kafka.topics.user-created:user-created-events}",
            groupId = "${spring.kafka.consumer.group-id:auth-service-group}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleUserCreated(UserCreatedEvent event) {
        log.info("Auth Service 收到用户创建事件: userId={}, username={}, eventId={}",
                event.getUserId(), event.getUsername(), event.getEventId());

        try {
            // 初始化用户认证配置
            initializeAuthConfig(event.getUserId());
            
            // 发送欢迎邮件（可选）
            if (event.getEmail() != null && !"admin-create".equals(event.getSource())) {
                sendWelcomeNotification(event.getEmail(), event.getUsername());
            }

            log.info("Auth Service 成功处理用户创建事件: userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("Auth Service 处理用户创建事件失败: userId={}, error={}",
                    event.getUserId(), e.getMessage(), e);
            // 可以选择重新抛出异常以触发重试机制
            throw e;
        }
    }

    /**
     * 初始化用户认证配置
     * 例如：设置默认安全策略、初始化 MFA 状态等
     */
    private void initializeAuthConfig(Long userId) {
        log.debug("初始化用户认证配置: userId={}", userId);
        // TODO: 实现具体的初始化逻辑
        // 例如：设置默认登录策略、初始化 MFA 状态等
    }

    /**
     * 发送欢迎通知
     */
    private void sendWelcomeNotification(String email, String username) {
        log.debug("发送欢迎通知: email={}, username={}", email, username);
        // TODO: 集成邮件服务发送欢迎邮件
    }
}
