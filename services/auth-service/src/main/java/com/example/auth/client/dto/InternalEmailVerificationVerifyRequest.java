package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 内部 API 请求：验证邮箱 token */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalEmailVerificationVerifyRequest {
    private String token;
}
