package com.example.order.temporal;

import com.example.order.entity.OrderEntity;
import com.example.order.mapper.OrderMapper;
import io.temporal.spring.boot.ActivityImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 审批 Activities 实现
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ActivityImpl(taskQueues = "approval-queue")
public class ApprovalActivitiesImpl implements ApprovalActivities {

    private static final BigDecimal MANAGER_THRESHOLD = new BigDecimal("1000");
    
    private final OrderMapper orderMapper;

    @Override
    public List<String> determineApprovalChain(BigDecimal amount, String tenantId) {
        List<String> chain = new ArrayList<>();
        
        // 所有非自动审批的订单都需要主管审批
        chain.add("SUPERVISOR");
        
        // 大额订单需要经理审批
        if (amount.compareTo(MANAGER_THRESHOLD) >= 0) {
            chain.add("MANAGER");
        }
        
        log.info("审批链路确定: amount={}, tenantId={}, chain={}", amount, tenantId, chain);
        return chain;
    }

    @Override
    public void sendApprovalNotification(Long orderId, String approverId, BigDecimal amount) {
        // 实际应用中可以发送邮件、短信、站内信等
        log.info("发送审批通知: orderId={}, approverId={}, amount={}", orderId, approverId, amount);
        // notificationService.send(approverId, "有新的订单待审批", "订单ID: " + orderId);
    }

    @Override
    public void updateOrderApprovalStatus(Long orderId, String status, String approvedBy) {
        OrderEntity order = orderMapper.findById(orderId);
        if (order != null) {
            // 更新订单状态 - 实际应用中可能需要额外的审批状态字段
            order.setStatus("APPROVAL_" + status);
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.update(order);
            log.info("订单审批状态更新: orderId={}, status={}, approvedBy={}", orderId, status, approvedBy);
        }
    }
}
