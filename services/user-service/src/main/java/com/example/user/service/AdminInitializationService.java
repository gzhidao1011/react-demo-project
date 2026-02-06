package com.example.user.service;

import com.example.user.config.AdminInitializationProperties;
import com.example.user.entity.RoleEntity;
import com.example.user.entity.UserEntity;
import com.example.user.event.UserEventPublisher;
import com.example.user.mapper.RoleMapper;
import com.example.user.mapper.UserMapper;
import com.example.user.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;

/**
 * Admin 账号初始化服务
 * 在应用启动时检查并创建初始 admin 账号（如果配置了环境变量且用户不存在）
 * 
 * 符合国外主流做法：
 * 1. 通过环境变量配置 admin 账号信息（不硬编码）
 * 2. 仅在首次启动时创建（幂等性）
 * 3. 自动分配 ADMIN 角色
 * 4. 生产环境可通过环境变量禁用
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "admin.initialization", name = "enabled", havingValue = "true", matchIfMissing = true)
public class AdminInitializationService {

    private final AdminInitializationProperties properties;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserEventPublisher userEventPublisher;

    /**
     * 应用启动时初始化 admin 账号
     */
    @PostConstruct
    @Transactional
    public void initializeAdmin() {
        // 检查是否配置了邮箱和密码
        if (properties.getEmail() == null || properties.getEmail().isBlank()) {
            log.warn("Admin initialization is enabled but ADMIN_INIT_EMAIL is not set. Skipping admin initialization.");
            return;
        }

        if (properties.getPassword() == null || properties.getPassword().isBlank()) {
            log.warn("Admin initialization is enabled but ADMIN_INIT_PASSWORD is not set. Skipping admin initialization.");
            return;
        }

        // 规范化邮箱（转换为小写并去除空格，与登录验证逻辑保持一致）
        String normalizedEmail = properties.getEmail().trim().toLowerCase();
        
        // 检查 admin 用户是否已存在
        UserEntity existingUser = userMapper.findByEmail(normalizedEmail);
        if (existingUser != null) {
            log.info("Admin user with email {} already exists. Skipping initialization.", normalizedEmail);
            return;
        }

        // 查找 ADMIN 角色
        RoleEntity adminRole = roleMapper.findByCode("ADMIN", false);
        if (adminRole == null) {
            log.warn("ADMIN role not found. Please ensure V7__rbac_seed_data.sql migration has been executed.");
            return;
        }

        // 创建 admin 用户
        try {
            LocalDateTime now = LocalDateTime.now();
            UserEntity adminUser = new UserEntity();
            adminUser.setName(properties.getName() != null ? properties.getName() : "Administrator");
            adminUser.setEmail(normalizedEmail); // 使用规范化后的邮箱
            adminUser.setPhone(properties.getPhone());
            adminUser.setPassword(passwordEncoder.encode(properties.getPassword()));
            adminUser.setEmailVerified(true); // Admin 账号默认已验证
            adminUser.setCreatedAt(now);
            adminUser.setUpdatedAt(now);
            adminUser.setDeletedAt(null);

            userMapper.insert(adminUser);

            // 分配 ADMIN 角色
            userRoleMapper.insert(adminUser.getId(), adminRole.getId(), now);
            
            // 发布用户创建事件 (Phase 2 事件驱动)
            userEventPublisher.publishUserCreated(adminUser.getId(), adminUser.getName(), adminUser.getEmail(), "admin-init");

            log.info("Admin user initialized successfully: email={}, name={}", 
                    normalizedEmail, adminUser.getName());
        } catch (Exception e) {
            log.error("Failed to initialize admin user", e);
            // 不抛出异常，避免影响应用启动
        }
    }
}
