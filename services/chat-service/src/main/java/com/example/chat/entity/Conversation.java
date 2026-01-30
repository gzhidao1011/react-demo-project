package com.example.chat.entity;

import lombok.Data;

import java.time.Instant;

/**
 * 会话实体（MyBatis）
 */
@Data
public class Conversation {

    private String id;
    private String userId;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
}
