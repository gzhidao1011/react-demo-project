package com.example.auth.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** 内部 API 请求：创建用户（注册） */
@Data
public class InternalCreateUserRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(max = 50)
    private String name;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100)
    private String password;
}
