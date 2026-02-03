package com.example.user.controller.internal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 内部 API：更新密码（支持重置密码与修改密码）
 * - 重置密码：仅 newPassword，无 currentPassword
 * - 修改密码：currentPassword + newPassword
 */
@Data
public class InternalUpdatePasswordRequest {
    /** 当前密码（修改密码时必填，重置密码时不传） */
    @Size(max = 100)
    private String currentPassword;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 100)
    private String newPassword;
}
