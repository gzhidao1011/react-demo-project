package com.example.api.common.tenant;

import lombok.extern.slf4j.Slf4j;

/**
 * 租户上下文
 * 用于在当前线程中存储和传递租户信息
 */
@Slf4j
public class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<TenantInfo> TENANT_INFO = new ThreadLocal<>();

    /**
     * 设置当前租户ID
     */
    public static void setTenantId(String tenantId) {
        log.debug("设置租户上下文: {}", tenantId);
        CURRENT_TENANT.set(tenantId);
    }

    /**
     * 获取当前租户ID
     */
    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    /**
     * 设置租户详细信息
     */
    public static void setTenantInfo(TenantInfo info) {
        TENANT_INFO.set(info);
    }

    /**
     * 获取租户详细信息
     */
    public static TenantInfo getTenantInfo() {
        return TENANT_INFO.get();
    }

    /**
     * 清除租户上下文（在请求结束时调用）
     */
    public static void clear() {
        CURRENT_TENANT.remove();
        TENANT_INFO.remove();
    }

    /**
     * 兼容旧API - setCurrentTenant
     */
    public static void setCurrentTenant(String tenantId) {
        setTenantId(tenantId);
    }

    /**
     * 兼容旧API - getCurrentTenant
     */
    public static String getCurrentTenant() {
        return getTenantId();
    }
}
