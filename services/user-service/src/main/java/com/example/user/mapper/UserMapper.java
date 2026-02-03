package com.example.user.mapper;

import com.example.user.entity.UserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户数据访问层（MyBatis Mapper）
 */
@Mapper
public interface UserMapper {

    /**
     * 根据 ID 查找用户（含软删除）
     */
    UserEntity findById(Long id);

    /**
     * 根据 ID 查找用户（仅未删除）
     */
    UserEntity findByIdExcludingDeleted(Long id);

    /**
     * 根据邮箱查找用户（仅未删除，用于登录与唯一性校验）
     */
    UserEntity findByEmail(String email);

    /**
     * 根据邮箱查找用户（可选是否包含已删除）
     */
    UserEntity findByEmailWithDeleted(@Param("email") String email, @Param("excludeDeleted") boolean excludeDeleted);

    /**
     * 根据手机号查找用户
     */
    UserEntity findByPhone(String phone);

    /**
     * 查找所有用户（可选是否包含已软删除）
     */
    List<UserEntity> findAll(@Param("includeDeleted") boolean includeDeleted);

    /**
     * 分页查询用户（可选筛选、排序）
     */
    List<UserEntity> findPage(@Param("email") String email, @Param("name") String name,
                             @Param("roleCode") String roleCode, @Param("includeDeleted") Boolean includeDeleted,
                             @Param("offset") long offset, @Param("size") int size,
                             @Param("orderBy") String orderBy);

    /**
     * 统计用户数量（可选是否包含已软删除）
     */
    long count(@Param("includeDeleted") boolean includeDeleted);

    /**
     * 统计分页筛选后的用户数量
     */
    long countPage(@Param("email") String email, @Param("name") String name,
                   @Param("roleCode") String roleCode, @Param("includeDeleted") Boolean includeDeleted);

    /**
     * 检查邮箱是否存在（仅未删除用户）
     */
    boolean existsByEmail(String email);

    /**
     * 检查邮箱是否存在（可选是否排除已删除）
     */
    boolean existsByEmailWithDeleted(@Param("email") String email, @Param("excludeDeleted") boolean excludeDeleted);

    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);

    /**
     * 检查 ID 是否存在
     */
    boolean existsById(Long id);

    /**
     * 插入用户
     */
    int insert(UserEntity user);

    /**
     * 更新用户
     */
    int update(UserEntity user);

    /**
     * 更新用户密码（用于密码重置）
     *
     * @param userId 用户 ID
     * @param encodedPassword BCrypt 编码后的新密码
     * @param updatedAt 更新时间
     * @return 更新的行数
     */
    int updatePassword(@Param("userId") Long userId, @Param("encodedPassword") String encodedPassword, @Param("updatedAt") java.time.LocalDateTime updatedAt);

    /**
     * 根据 ID 物理删除用户
     */
    int deleteById(Long id);

    /**
     * 软删除用户（设置 deleted_at）
     */
    int softDeleteById(@Param("id") Long id, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * 恢复软删除用户（清除 deleted_at）
     */
    int restoreById(Long id);

    /**
     * 删除所有用户（仅用于测试）
     */
    int deleteAll();
}
