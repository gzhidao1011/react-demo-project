package com.example.user.controller.internal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 内部 API：发送邮箱验证邮件（供 auth-service 注册后调用）
 */
@Data
public class InternalEmailVerificationSendRequest {
    @NotNull(message = "用户 ID 不能为空")
    private Long userId;

    @NotNull(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}
