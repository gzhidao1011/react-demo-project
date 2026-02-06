package com.example.order.temporal;

import com.example.order.entity.OrderEntity;
import com.example.order.mapper.OrderMapper;
import io.temporal.spring.boot.ActivityImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单 Saga Activities 实现
 * 每个 Activity 是一个可补偿的操作
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ActivityImpl(taskQueues = "order-saga-queue")
public class OrderActivitiesImpl implements OrderActivities {

    private final OrderMapper orderMapper;

    @Override
    public Long createOrder(Long userId, Long productId, Integer quantity, 
                           BigDecimal amount, String tenantId) {
        if (amount == null) {
            throw new IllegalArgumentException("amount is required");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        var now = LocalDateTime.now();
        
        OrderEntity order = new OrderEntity();
        order.setUserId(userId);
        order.setProductName("Product-" + productId); // 实际应用中应从商品服务获取
        order.setPrice(amount.divide(BigDecimal.valueOf(quantity), 2, java.math.RoundingMode.HALF_UP));
        order.setQuantity(quantity);
        order.setStatus("PENDING");
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        
        orderMapper.insert(order);
        log.info("订单创建成功: orderId={}, userId={}, tenantId={}", order.getId(), userId, tenantId);
        
        return order.getId();
    }

    @Override
    public boolean reserveInventory(Long productId, Integer quantity, String tenantId) {
        // TODO: 实际应用中应调用库存服务
        // 这里模拟库存预留
        log.info("库存预留: productId={}, quantity={}, tenantId={}", productId, quantity, tenantId);
        
        // 模拟库存检查 - 实际应调用 InventoryClient
        // return inventoryClient.reserveStock(productId, quantity);
        return true;
    }

    @Override
    public boolean deductBalance(Long userId, BigDecimal amount, String tenantId) {
        // TODO: 实际应用中应调用用户服务扣减余额
        // 这里模拟余额扣减
        log.info("余额扣减: userId={}, amount={}, tenantId={}", userId, amount, tenantId);
        
        // 模拟余额检查 - 实际应调用 UserClient
        // return userClient.deductBalance(userId, amount);
        return true;
    }

    @Override
    public void confirmOrder(Long orderId) {
        OrderEntity order = orderMapper.findById(orderId);
        if (order != null) {
            order.setStatus("CONFIRMED");
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.update(order);
            log.info("订单确认成功: orderId={}", orderId);
        }
    }

    // ========== 补偿操作 ==========

    @Override
    public void cancelOrder(Long orderId) {
        OrderEntity order = orderMapper.findById(orderId);
        if (order != null) {
            order.setStatus("CANCELLED");
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.update(order);
            log.info("订单取消(补偿): orderId={}", orderId);
        }
    }

    @Override
    public void releaseInventory(Long productId, Integer quantity, String tenantId) {
        // TODO: 实际应用中应调用库存服务释放库存
        log.info("库存释放(补偿): productId={}, quantity={}, tenantId={}", productId, quantity, tenantId);
        
        // 实际应调用 InventoryClient
        // inventoryClient.releaseStock(productId, quantity);
    }

    @Override
    public void refundBalance(Long userId, BigDecimal amount, String tenantId) {
        // TODO: 实际应用中应调用用户服务退还余额
        log.info("余额退还(补偿): userId={}, amount={}, tenantId={}", userId, amount, tenantId);
        
        // 实际应调用 UserClient
        // userClient.refundBalance(userId, amount);
    }
}
