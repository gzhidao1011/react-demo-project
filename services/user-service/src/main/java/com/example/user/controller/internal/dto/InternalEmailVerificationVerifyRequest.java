package com.example.user.controller.internal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 内部 API：验证邮箱 token（供 auth-service 验证邮箱后签发 JWT）
 */
@Data
public class InternalEmailVerificationVerifyRequest {
    @NotBlank(message = "token 不能为空")
    private String token;
}
