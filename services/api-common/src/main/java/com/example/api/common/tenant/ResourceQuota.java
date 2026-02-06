package com.example.api.common.tenant;

import lombok.Data;

/**
 * 资源配额
 * 用于限制各租户的资源使用
 */
@Data
public class ResourceQuota {
    /** 最大用户数 */
    private int maxUsers;
    /** 最大订单数 */
    private int maxOrders;
    /** 最大存储空间（字节） */
    private long maxStorageBytes;
    /** 每日最大 API 调用次数 */
    private int maxApiCallsPerDay;
    
    // 当前使用量
    /** 当前用户数 */
    private int currentUsers;
    /** 当前订单数 */
    private int currentOrders;
    /** 当前存储空间使用（字节） */
    private long currentStorageBytes;
    /** 今日 API 调用次数 */
    private int todayApiCalls;

    /**
     * 检查是否可以创建新用户
     */
    public boolean canCreateUser() {
        return currentUsers < maxUsers;
    }

    /**
     * 检查是否可以创建新订单
     */
    public boolean canCreateOrder() {
        return currentOrders < maxOrders;
    }

    /**
     * 检查是否可以进行 API 调用
     */
    public boolean canMakeApiCall() {
        return todayApiCalls < maxApiCallsPerDay;
    }

    /**
     * 检查是否有足够的存储空间
     */
    public boolean hasStorageSpace(long requiredBytes) {
        return currentStorageBytes + requiredBytes <= maxStorageBytes;
    }
}
