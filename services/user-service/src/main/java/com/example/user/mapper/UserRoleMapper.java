package com.example.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户-角色关联 Mapper
 */
@Mapper
public interface UserRoleMapper {

    List<Long> findRoleIdsByUserId(Long userId);

    int insert(@Param("userId") Long userId, @Param("roleId") Long roleId, @Param("createdAt") java.time.LocalDateTime createdAt);

    int deleteByUserId(Long userId);

    int deleteByUserIdAndRoleId(@Param("userId") Long userId, @Param("roleId") Long roleId);
}
