package com.example.user.mapper;

import com.example.user.entity.UserEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 用户数据访问层（MyBatis Mapper）
 */
@Mapper
public interface UserMapper {

    /**
     * 根据 ID 查找用户
     */
    UserEntity findById(Long id);

    /**
     * 根据邮箱查找用户
     */
    UserEntity findByEmail(String email);

    /**
     * 根据手机号查找用户
     */
    UserEntity findByPhone(String phone);

    /**
     * 查找所有用户
     */
    List<UserEntity> findAll();

    /**
     * 统计用户数量
     */
    long count();

    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);

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
     * 根据 ID 删除用户
     */
    int deleteById(Long id);

    /**
     * 删除所有用户（仅用于测试）
     */
    int deleteAll();
}
