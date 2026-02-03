package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 内部 API 请求：请求密码重置 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalPasswordResetRequestRequest {
    private String email;
}
