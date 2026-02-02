package com.example.user.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 邮箱验证 Token 实体
 * 存储 token 的 SHA-256 哈希，不存明文
 */
@Data
public class EmailVerificationTokenEntity {

    private Long id;
    private Long userId;
    private String tokenHash;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
