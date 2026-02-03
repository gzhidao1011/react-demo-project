package com.example.user.mapper;

import com.example.user.entity.PermissionEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 权限数据访问层（MyBatis Mapper）
 */
@Mapper
public interface PermissionMapper {

    PermissionEntity findById(Long id);

    List<PermissionEntity> findAll();

    PermissionEntity findByResourceAndAction(@Param("resource") String resource, @Param("action") String action);

    int insert(PermissionEntity permission);
}
