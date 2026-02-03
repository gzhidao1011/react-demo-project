package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 内部 API 请求：校验密码重置 token */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalPasswordResetValidateRequest {
    private String token;
}
