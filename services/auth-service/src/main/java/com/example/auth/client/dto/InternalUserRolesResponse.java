package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 内部 API 响应：用户角色列表 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalUserRolesResponse {
    private List<String> roles;
}
