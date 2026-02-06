package com.example.order.temporal;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.math.BigDecimal;

/**
 * 订单 Saga 的 Activities 接口
 * 每个 Activity 是一个可补偿的操作
 */
@ActivityInterface
public interface OrderActivities {

    // ========== 正向操作 ==========

    @ActivityMethod
    Long createOrder(Long userId, Long productId, Integer quantity, BigDecimal amount, String tenantId);

    @ActivityMethod
    boolean reserveInventory(Long productId, Integer quantity, String tenantId);

    @ActivityMethod
    boolean deductBalance(Long userId, BigDecimal amount, String tenantId);

    @ActivityMethod
    void confirmOrder(Long orderId);

    // ========== 补偿操作 ==========

    @ActivityMethod
    void cancelOrder(Long orderId);

    @ActivityMethod
    void releaseInventory(Long productId, Integer quantity, String tenantId);

    @ActivityMethod
    void refundBalance(Long userId, BigDecimal amount, String tenantId);
}
