package com.example.user.controller.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 内部 API：用户信息（供 auth-service /me、refresh 等）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalUserInfoResponse {
    private Long id;
    private String email;
    private String name;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
}
