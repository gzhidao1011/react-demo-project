package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 内部 API 响应：密码重置 token 校验成功（userId） */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalPasswordResetValidateResponse {
    private Long userId;
}
