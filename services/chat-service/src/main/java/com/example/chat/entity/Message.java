package com.example.chat.entity;

import lombok.Data;

import java.time.Instant;

/**
 * 消息实体（MyBatis）
 */
@Data
public class Message {

    private String id;
    private String conversationId;
    private String role;
    private String content;
    private Instant createdAt;
}
