package com.example.user.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 权限实体（MyBatis）
 * 与设计文档 2.1 一致：(resource, action) 唯一
 */
@Data
public class PermissionEntity {

    private Long id;
    private String resource;
    private String action;
    private String description;
    private LocalDateTime createdAt;
}
