package com.example.user.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色实体（MyBatis）
 * 与设计文档 2.1 一致：code 唯一，软删除
 */
@Data
public class RoleEntity {

    private Long id;
    private String name;
    private String code;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
