package com.example.order.event;

import com.example.api.event.UserCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * 用户事件监听器 - Order Service
 * 监听用户创建事件，初始化订单相关配置
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventListener {

    /**
     * 处理用户创建事件
     * - 初始化用户订单账户
     * - 设置默认购物配置
     */
    @KafkaListener(
            topics = "${kafka.topics.user-created:user-created-events}",
            groupId = "${spring.kafka.consumer.group-id:order-service-group}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleUserCreated(UserCreatedEvent event) {
        log.info("Order Service 收到用户创建事件: userId={}, username={}, eventId={}",
                event.getUserId(), event.getUsername(), event.getEventId());

        try {
            // 初始化用户订单账户
            initializeOrderAccount(event.getUserId());

            log.info("Order Service 成功处理用户创建事件: userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("Order Service 处理用户创建事件失败: userId={}, error={}",
                    event.getUserId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 初始化用户订单账户
     * 例如：创建默认收货地址、初始化购物车等
     */
    private void initializeOrderAccount(Long userId) {
        log.debug("初始化用户订单账户: userId={}", userId);
        // TODO: 实现具体的初始化逻辑
        // 例如：创建空购物车、设置默认配送偏好等
    }
}
