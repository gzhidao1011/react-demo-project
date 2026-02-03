package com.example.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 角色-权限关联 Mapper
 */
@Mapper
public interface RolePermissionMapper {

    List<Long> findPermissionIdsByRoleId(Long roleId);

    int insert(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId, @Param("createdAt") java.time.LocalDateTime createdAt);

    int deleteByRoleId(Long roleId);
}
