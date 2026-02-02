package com.example.api.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 邮箱验证请求 DTO
 */
@Data
public class VerifyEmailRequest {

    /**
     * 验证 token（从邮件链接中获取）
     */
    @NotBlank(message = "验证 token 不能为空")
    private String token;
}
