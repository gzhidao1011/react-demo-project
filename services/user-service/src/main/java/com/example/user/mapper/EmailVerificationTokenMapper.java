package com.example.user.mapper;

import com.example.user.entity.EmailVerificationTokenEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 邮箱验证 Token 数据访问层
 */
@Mapper
public interface EmailVerificationTokenMapper {

    /**
     * 根据 token 哈希查找
     */
    EmailVerificationTokenEntity findByTokenHash(String tokenHash);

    /**
     * 根据用户 ID 查找（用于重新发送时删除旧 token）
     */
    EmailVerificationTokenEntity findByUserId(Long userId);

    /**
     * 插入
     */
    int insert(EmailVerificationTokenEntity entity);

    /**
     * 根据 ID 删除
     */
    int deleteById(Long id);

    /**
     * 根据用户 ID 删除
     */
    int deleteByUserId(Long userId);

    /**
     * 删除所有（仅用于测试）
     */
    int deleteAll();
}
