package com.example.user.controller.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 角色详情 DTO（含权限列表）
 */
@Data
public class RoleDetailDto {
    private Long id;
    private String name;
    private String code;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private List<PermissionDto> permissions;
}
