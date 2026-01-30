package com.example.chat.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 消息 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    private String id;
    private String role;
    private String content;
    private Instant createdAt;
}
