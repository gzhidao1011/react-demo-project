package com.example.api.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户创建事件 (共享事件类)
 * 当新用户注册成功后发布此事件，供其他服务订阅处理
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreatedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 事件来源（registration, admin-create, import 等）
     */
    private String source;

    /**
     * 事件ID（用于幂等性处理）
     */
    private String eventId;
}
