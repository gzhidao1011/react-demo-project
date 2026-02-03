package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 内部 API 响应：创建用户成功（userId），字段名与 user-service 返回的 JSON 一致 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalCreateUserResponse {
    private Long userId;
}
