package com.example.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应 DTO
 * 严格遵循 OAuth 2.0 Token Response 格式（RFC 6749 Section 5.1）
 * 
 * 参考标准：
 * - OAuth 2.0 (RFC 6749): https://tools.ietf.org/html/rfc6749#section-5.1
 * - Auth0 Token Response: https://auth0.com/docs/api/authentication#get-token
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    
    /**
     * Access Token（访问令牌）
     * OAuth 2.0 标准字段
     */
    @JsonProperty("access_token")
    private String accessToken;
    
    /**
     * Token 类型，固定为 "Bearer"
     * OAuth 2.0 标准字段
     */
    @JsonProperty("token_type")
    @Builder.Default
    private String tokenType = "Bearer";
    
    /**
     * Access Token 有效期（秒）
     * OAuth 2.0 标准字段
     */
    @JsonProperty("expires_in")
    private Long expiresIn;
    
    /**
     * Refresh Token（刷新令牌）
     * OAuth 2.0 标准字段（可选，但推荐实现）
     */
    @JsonProperty("refresh_token")
    private String refreshToken;
    
    /**
     * 权限范围（可选）
     * OAuth 2.0 标准字段
     */
    @JsonProperty("scope")
    @Builder.Default
    private String scope = "read write";
    
    /**
     * 用户信息（扩展字段，非 OAuth 2.0 标准）
     * 包含用户基本信息，便于前端直接使用
     */
    @JsonProperty("user")
    private UserInfo user;
    
    /**
     * 用户信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String email;
        private String username;
        private Boolean emailVerified;
    }
}
