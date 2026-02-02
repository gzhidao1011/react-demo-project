package com.example.user.mapper;

import com.example.user.entity.PasswordResetTokenEntity;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDateTime;

/**
 * 密码重置 Token 数据访问层
 */
@Mapper
public interface PasswordResetTokenMapper {

    /**
     * 根据 token 哈希查找
     */
    PasswordResetTokenEntity findByTokenHash(String tokenHash);

    /**
     * 插入
     */
    int insert(PasswordResetTokenEntity entity);

    /**
     * 根据 ID 删除
     */
    int deleteById(Long id);

    /**
     * 根据用户 ID 删除
     */
    int deleteByUserId(Long userId);

    /**
     * 删除指定时间之前过期的记录（用于定时清理）
     *
     * @param before 过期时间早于此时间的记录将被删除
     * @return 删除的记录数
     */
    int deleteExpiredBefore(LocalDateTime before);

    /**
     * 删除所有（仅用于测试）
     */
    int deleteAll();
}
