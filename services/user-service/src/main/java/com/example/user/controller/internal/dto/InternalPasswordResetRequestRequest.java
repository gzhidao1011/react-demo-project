package com.example.user.controller.internal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 内部 API：请求密码重置（供 auth-service 忘记密码接口调用）
 */
@Data
public class InternalPasswordResetRequestRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}
