package com.example.api.common.tenant;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 多租户配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "multi-tenant")
public class TenantProperties {

    /** 是否启用多租户 */
    private boolean enabled = false;
    
    /** 隔离策略 */
    private IsolationStrategy strategy = IsolationStrategy.SCHEMA;
    
    /** 默认数据源配置 */
    private DatabaseConfig defaultDatabase;
    
    /** 各租户配置 */
    private Map<String, TenantConfig> tenants = new HashMap<>();

    /**
     * 隔离策略
     */
    public enum IsolationStrategy {
        /** 独立数据库 */
        DATABASE,
        /** 独立 Schema */
        SCHEMA,
        /** 共享表 + 租户列 */
        COLUMN
    }

    /**
     * 租户配置
     */
    @Data
    public static class TenantConfig {
        private String name;
        private DatabaseConfig database;
        private QuotaConfig quota;
    }

    /**
     * 数据库配置
     */
    @Data
    public static class DatabaseConfig {
        private String url;
        private String username;
        private String password;
        private String driverClassName = "com.mysql.cj.jdbc.Driver";
        private int maxPoolSize = 10;
        private int minPoolSize = 2;
        private long connectionTimeout = 30000;
        private long idleTimeout = 600000;
    }

    /**
     * 配额配置
     */
    @Data
    public static class QuotaConfig {
        private int maxUsers = 100;
        private int maxOrders = 1000;
        private long maxStorageBytes = 1073741824L; // 1GB
        private int maxApiCallsPerDay = 10000;
    }
}
