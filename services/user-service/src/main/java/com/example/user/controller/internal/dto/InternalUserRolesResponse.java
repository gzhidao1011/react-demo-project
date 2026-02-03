package com.example.user.controller.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 内部 API：用户角色列表（供 auth-service 刷新 Token 时拉取最新角色）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalUserRolesResponse {
    private List<String> roles;
}
