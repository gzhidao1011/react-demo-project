package com.example.user.mapper;

import com.example.user.entity.AuditLogEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 审计日志 Mapper
 * 与设计文档 2.7 一致
 */
@Mapper
public interface AuditLogMapper {

    int insert(AuditLogEntity auditLog);

    List<AuditLogEntity> findPage(@Param("actorId") Long actorId, @Param("resourceType") String resourceType,
                                  @Param("offset") long offset, @Param("size") int size);

    long count(@Param("actorId") Long actorId, @Param("resourceType") String resourceType);
}
