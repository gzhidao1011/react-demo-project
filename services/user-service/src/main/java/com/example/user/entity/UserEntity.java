package com.example.user.entity;

import com.example.api.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体类（JPA）
 * 用于数据库持久化
 */
@Entity
@Table(name = "users")
@Data
public class UserEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    @Column(unique = true, nullable = false, length = 100)
    private String email;
    
    @Column(length = 20)
    private String phone;
    
    /**
     * 用户密码（BCrypt 加密后的哈希值）
     * 不在 DTO 转换中返回，确保安全
     */
    @Column(name = "password", nullable = false, length = 255)
    private String password;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
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
        // 注意：不设置 password 字段，确保敏感信息不泄露
        return user;
    }
}
