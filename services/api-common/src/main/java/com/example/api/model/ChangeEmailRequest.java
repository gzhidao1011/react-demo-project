package com.example.api.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 修改邮箱请求 DTO
 * 需当前密码验证，修改后需重新验证新邮箱
 */
@Data
public class ChangeEmailRequest {

    /**
     * 新邮箱地址
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "请输入有效的邮箱地址")
    private String newEmail;

    /**
     * 当前密码（用于验证身份）
     */
    @NotBlank(message = "当前密码不能为空")
    private String currentPassword;
}
