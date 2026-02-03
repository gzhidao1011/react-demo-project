package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 内部 API 响应：用户信息（/me、refresh、verify-email 等） */
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
