package com.example.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 刷新 Token 请求 DTO
 * 遵循 OAuth 2.0 Refresh Token Grant 模式（RFC 6749 Section 6）
 */
@Data
public class RefreshTokenRequest {
    
    /**
     * Refresh Token
     * 用于获取新的 Access Token
     */
    @NotBlank(message = "Refresh Token 不能为空")
    @JsonProperty("refresh_token")
    private String refreshToken;
}
