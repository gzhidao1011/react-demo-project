package com.example.user.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Admin 账号初始化配置
 * 通过环境变量配置初始 admin 账号信息
 */
@Data
@Component
@ConfigurationProperties(prefix = "admin.initialization")
public class AdminInitializationProperties {

    /**
     * 是否启用 admin 账号自动初始化
     * 默认：true（开发环境建议启用，生产环境建议通过环境变量禁用）
     */
    private boolean enabled = true;

    /**
     * Admin 账号邮箱（必填，如果启用初始化）
     * 通过环境变量 ADMIN_INIT_EMAIL 配置
     */
    private String email;

    /**
     * Admin 账号密码（必填，如果启用初始化）
     * 通过环境变量 ADMIN_INIT_PASSWORD 配置
     * 注意：生产环境必须使用强密码
     */
    private String password;

    /**
     * Admin 账号姓名（可选）
     * 默认：Administrator
     */
    private String name = "Administrator";

    /**
     * Admin 账号手机号（可选）
     */
    private String phone;
}
