package com.example.user.controller.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 内部 API：按邮箱查用户（供 auth-service 忘记密码等）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalUserByEmailResponse {
    private Long userId;
    private String email;
}
