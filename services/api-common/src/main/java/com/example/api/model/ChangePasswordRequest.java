package com.example.api.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 修改密码请求 DTO
 * 需当前密码验证
 */
@Data
public class ChangePasswordRequest {

    /**
     * 当前密码（用于验证身份）
     */
    @NotBlank(message = "当前密码不能为空")
    private String currentPassword;

    /**
     * 新密码
     */
    @NotBlank(message = "新密码不能为空")
    private String newPassword;
}
