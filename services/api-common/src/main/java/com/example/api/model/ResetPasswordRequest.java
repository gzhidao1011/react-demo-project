package com.example.api.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 重置密码请求 DTO
 * 后端仅依赖 token 校验，不传 email
 */
@Data
public class ResetPasswordRequest {

    /**
     * 密码重置 token（从邮件链接获取）
     */
    @NotBlank(message = "重置链接无效或已过期")
    private String token;

    /**
     * 新密码
     */
    @NotBlank(message = "密码不能为空")
    private String newPassword;
}
