package com.example.user.controller.dto;

import lombok.Data;

/**
 * 权限 DTO
 */
@Data
public class PermissionDto {
    private Long id;
    private String resource;
    private String action;
    private String description;
}
