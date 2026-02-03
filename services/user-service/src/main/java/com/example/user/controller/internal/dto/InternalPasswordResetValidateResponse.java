package com.example.user.controller.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 内部 API：密码重置 token 校验成功返回 userId（供 auth-service 调用 updatePassword）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalPasswordResetValidateResponse {
    private Long userId;
}
