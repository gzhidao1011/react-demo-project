package com.example.api.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 注册请求 DTO
 * 遵循 OAuth 2.0 标准，使用邮箱和密码注册
 */
@Data
public class RegisterRequest {
    
    /**
     * 用户邮箱
     * 必须符合邮箱格式，不能为空
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "请输入有效的邮箱地址")
    private String email;
    
    /**
     * 用户密码
     * 最少 8 个字符，最多 128 个字符，必须符合密码策略
     * 注意：密码策略验证在服务层进行
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 128, message = "密码长度必须在 8-128 个字符之间")
    private String password;
    
    /**
     * 密码确认（可选，前端验证）
     * 后端不验证此字段，由前端确保两次密码一致
     */
    private String confirmPassword;
}
