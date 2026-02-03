package com.example.user.controller.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 内部 API：重新发送邮箱验证邮件
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalEmailVerificationResendRequest {
    private String email;
}
