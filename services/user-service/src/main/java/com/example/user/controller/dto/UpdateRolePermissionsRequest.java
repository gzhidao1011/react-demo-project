package com.example.user.controller.dto;

import lombok.Data;

import java.util.List;

/**
 * 为角色绑定权限请求（幂等替换）
 */
@Data
public class UpdateRolePermissionsRequest {
    private List<Long> permissionIds;
}
