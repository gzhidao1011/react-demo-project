package com.example.user.controller.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户详情 DTO（含角色列表，与设计文档 2.4 一致）
 */
@Data
public class UserDetailDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private List<RoleSummaryDto> roles;
}
