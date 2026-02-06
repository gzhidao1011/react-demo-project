package com.example.user.event;

import com.example.api.event.UserCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 用户事件发布器
 * 负责将用户相关事件发布到 Kafka
 * 仅在 spring.kafka.enabled=true 时加载（默认启用）
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class UserEventPublisher {

    private final KafkaTemplate<String, UserCreatedEvent> kafkaTemplate;

    @Value("${kafka.topics.user-created:user-created-events}")
    private String userCreatedTopic;

    /**
     * 发布用户创建事件
     *
     * @param userId   用户ID
     * @param username 用户名
     * @param email    邮箱
     * @param source   事件来源
     */
    public void publishUserCreated(Long userId, String username, String email, String source) {
        UserCreatedEvent event = UserCreatedEvent.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .createdAt(LocalDateTime.now())
                .source(source)
                .eventId(UUID.randomUUID().toString())
                .build();

        publishUserCreated(event);
    }

    /**
     * 发布用户创建事件
     *
     * @param event 用户创建事件
     */
    public void publishUserCreated(UserCreatedEvent event) {
        String key = String.valueOf(event.getUserId());
        
        CompletableFuture<SendResult<String, UserCreatedEvent>> future = 
                kafkaTemplate.send(userCreatedTopic, key, event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("用户创建事件发布成功: userId={}, topic={}, partition={}, offset={}",
                        event.getUserId(),
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("用户创建事件发布失败: userId={}, error={}", 
                        event.getUserId(), ex.getMessage(), ex);
            }
        });
    }
}
