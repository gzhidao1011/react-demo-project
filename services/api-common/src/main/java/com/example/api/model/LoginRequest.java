package com.example.api.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录请求 DTO
 * 遵循 OAuth 2.0 Password Grant 模式
 */
@Data
public class LoginRequest {
    
    /**
     * 用户邮箱
     * 必须符合邮箱格式，不能为空
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "请输入有效的邮箱地址")
    private String email;
    
    /**
     * 用户密码
     * 不能为空
     */
    @NotBlank(message = "密码不能为空")
    private String password;
}
