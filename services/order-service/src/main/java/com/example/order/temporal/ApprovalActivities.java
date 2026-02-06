package com.example.order.temporal;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.math.BigDecimal;
import java.util.List;

/**
 * 审批 Activities 接口
 */
@ActivityInterface
public interface ApprovalActivities {

    /**
     * 确定审批链路
     * 根据金额大小返回需要审批的人员列表
     */
    @ActivityMethod
    List<String> determineApprovalChain(BigDecimal amount, String tenantId);

    /**
     * 发送审批通知
     */
    @ActivityMethod
    void sendApprovalNotification(Long orderId, String approverId, BigDecimal amount);

    /**
     * 更新订单审批状态
     */
    @ActivityMethod
    void updateOrderApprovalStatus(Long orderId, String status, String approvedBy);
}
