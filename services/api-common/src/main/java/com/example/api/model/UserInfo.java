package com.example.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 当前用户信息 DTO
 * 用于 GET /auth/me 接口响应
 * 包含个人中心、设置页、导航栏所需的用户信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 用户 ID */
    private Long id;

    /** 邮箱 */
    private String email;

    /** 用户名（显示名称） */
    private String username;

    /** 手机号（可选） */
    private String phone;

    /** 邮箱是否已验证 */
    @JsonProperty("email_verified")
    private Boolean emailVerified;

    /** 创建时间 */
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
