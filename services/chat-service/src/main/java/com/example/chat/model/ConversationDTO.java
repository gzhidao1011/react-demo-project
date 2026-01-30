package com.example.chat.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 会话 DTO（列表项）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {

    private String id;
    private String title;
    private Instant updatedAt;
}
