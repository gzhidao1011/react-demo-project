package com.example.user.controller.internal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 内部 API：校验密码重置 token（供 auth-service 重置密码前调用，一次性消费）
 */
@Data
public class InternalPasswordResetValidateRequest {
    @NotBlank(message = "token 不能为空")
    private String token;
}
