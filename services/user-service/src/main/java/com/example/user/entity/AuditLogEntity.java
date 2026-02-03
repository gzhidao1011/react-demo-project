package com.example.user.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 审计日志实体（MyBatis）
 * 与设计文档 2.7 一致：谁在何时对何资源做了何操作
 */
@Data
public class AuditLogEntity {

    private Long id;
    private Long actorId;
    private String actorEmail;
    private String action;
    private String resourceType;
    private String resourceId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
