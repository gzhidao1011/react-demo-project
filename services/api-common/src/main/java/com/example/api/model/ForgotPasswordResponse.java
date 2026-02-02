package com.example.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 忘记密码响应 DTO
 * 用户枚举防护：无论邮箱是否存在均返回相同成功消息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordResponse {

    /**
     * 统一成功消息（不泄露用户是否存在）
     */
    private String message;
}
