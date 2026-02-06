package com.example.api.common.tenant;

import lombok.Data;

/**
 * 租户信息
 */
@Data
public class TenantInfo {
    private String tenantId;
    private String tenantName;
    private String databaseName;
    private TenantStatus status;
    private TenantPlan plan;
    private ResourceQuota quota;

    /**
     * 租户状态
     */
    public enum TenantStatus {
        /** 活跃 */
        ACTIVE,
        /** 已暂停 */
        SUSPENDED,
        /** 已过期 */
        EXPIRED
    }

    /**
     * 租户套餐
     */
    public enum TenantPlan {
        /** 免费版 */
        FREE,
        /** 基础版 */
        BASIC,
        /** 专业版 */
        PROFESSIONAL,
        /** 企业版 */
        ENTERPRISE
    }
}
