package com.example.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 注册响应 DTO
 * 用于邮箱验证模式：注册后不返回 token，仅提示用户查收验证邮件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    /**
     * 提示消息
     */
    @JsonProperty("message")
    private String message;

    /**
     * 用户邮箱（用于展示「请查收验证邮件」）
     */
    @JsonProperty("email")
    private String email;
}
