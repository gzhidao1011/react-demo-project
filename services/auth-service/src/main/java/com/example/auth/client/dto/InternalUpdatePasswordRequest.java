package com.example.auth.client.dto;

import lombok.Data;

/** 内部 API 请求：更新密码（currentPassword 可选，仅修改密码时传） */
@Data
public class InternalUpdatePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
