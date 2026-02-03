package com.example.user.mapper;

import com.example.user.entity.RoleEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 角色数据访问层（MyBatis Mapper）
 * 与设计文档 2.2 一致：列表默认过滤 deleted_at IS NULL
 */
@Mapper
public interface RoleMapper {

    RoleEntity findById(Long id);

    RoleEntity findByIdIncludingDeleted(Long id);

    RoleEntity findByCode(@Param("code") String code, @Param("excludeDeleted") boolean excludeDeleted);

    List<RoleEntity> findAll(@Param("includeDeleted") boolean includeDeleted);

    long count(@Param("includeDeleted") boolean includeDeleted);

    boolean existsByCode(String code);

    int insert(RoleEntity role);

    int update(RoleEntity role);

    int softDelete(@Param("id") Long id, @Param("deletedAt") java.time.LocalDateTime deletedAt);

    int restore(@Param("id") Long id);
}
