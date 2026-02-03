package com.example.user.controller.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 内部 API：创建用户成功后的响应（userId）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalCreateUserResponse {
    private Long userId;
}
