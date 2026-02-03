package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 内部 API 请求：发送邮箱验证邮件 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalEmailVerificationSendRequest {
    private Long userId;
    private String email;
}
