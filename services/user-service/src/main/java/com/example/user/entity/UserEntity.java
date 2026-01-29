package com.example.user.entity;

import com.example.api.model.User;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体类（MyBatis）
 * 用于数据库持久化
 */
@Data
public class UserEntity {

    private Long id;
    private String name;
    private String email;
    private String phone;

    /**
     * 用户密码（BCrypt 加密后的哈希值）
     * 不在 DTO 转换中返回，确保安全
     */
    private String password;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 转换为 DTO（不包含密码字段）
     *
     * @return User DTO 对象
     */
    public User toDTO() {
        User user = new User();
        user.setId(this.id);
        user.setName(this.name);
        user.setEmail(this.email);
        user.setPhone(this.phone);
        return user;
    }
}
