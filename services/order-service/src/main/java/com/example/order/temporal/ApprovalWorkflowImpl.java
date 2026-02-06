package com.example.order.temporal;

import com.example.order.temporal.model.ApprovalDecision;
import com.example.order.temporal.model.ApprovalRequest;
import com.example.order.temporal.model.ApprovalResult;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

/**
 * 审批 Workflow 实现
 * 
 * 审批规则:
 * - 金额 < 100: 自动审批
 * - 100 <= 金额 < 1000: 主管审批  
 * - 金额 >= 1000: 主管 + 经理二级审批
 */
public class ApprovalWorkflowImpl implements ApprovalWorkflow {

    private static final Logger log = Workflow.getLogger(ApprovalWorkflowImpl.class);

    private static final BigDecimal AUTO_APPROVE_THRESHOLD = new BigDecimal("100");

    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofSeconds(30))
        .build();

    private final ApprovalActivities activities = 
        Workflow.newActivityStub(ApprovalActivities.class, activityOptions);

    // Workflow 状态
    private String status = "PENDING";
    private String currentApprover = null;
    private ApprovalDecision latestDecision = null;
    private int currentApprovalIndex = 0;
    private List<String> approvalChain;

    @Override
    public ApprovalResult submitForApproval(ApprovalRequest request) {
        log.info("审批流程开始 - orderId={}, amount={}", request.getOrderId(), request.getAmount());
        
        // 小额自动审批
        if (request.getAmount().compareTo(AUTO_APPROVE_THRESHOLD) < 0) {
            log.info("小额订单自动审批 - orderId={}", request.getOrderId());
            activities.updateOrderApprovalStatus(request.getOrderId(), "APPROVED", "SYSTEM");
            return ApprovalResult.builder()
                .orderId(request.getOrderId())
                .status("APPROVED")
                .approvedBy("SYSTEM")
                .comment("小额订单自动审批")
                .build();
        }

        // 确定审批链路
        approvalChain = activities.determineApprovalChain(request.getAmount(), request.getTenantId());
        log.info("审批链路确定 - chain={}", approvalChain);
        
        // 逐级审批
        for (currentApprovalIndex = 0; currentApprovalIndex < approvalChain.size(); currentApprovalIndex++) {
            currentApprover = approvalChain.get(currentApprovalIndex);
            status = "WAITING_" + currentApprover;
            
            log.info("等待审批 - orderId={}, approver={}", request.getOrderId(), currentApprover);
            
            // 发送审批通知
            activities.sendApprovalNotification(request.getOrderId(), currentApprover, request.getAmount());
            
            // 等待审批决策（超时24小时）
            boolean received = Workflow.await(Duration.ofHours(24), () -> latestDecision != null);
            
            if (!received) {
                // 超时处理
                log.warn("审批超时 - orderId={}, approver={}", request.getOrderId(), currentApprover);
                status = "TIMEOUT";
                activities.updateOrderApprovalStatus(request.getOrderId(), "TIMEOUT", currentApprover);
                return ApprovalResult.builder()
                    .orderId(request.getOrderId())
                    .status("TIMEOUT")
                    .approvedBy(currentApprover)
                    .comment("审批超时")
                    .build();
            }
            
            if (!latestDecision.isApproved()) {
                // 拒绝
                log.info("审批被拒绝 - orderId={}, approver={}", request.getOrderId(), currentApprover);
                status = "REJECTED";
                activities.updateOrderApprovalStatus(request.getOrderId(), "REJECTED", currentApprover);
                return ApprovalResult.builder()
                    .orderId(request.getOrderId())
                    .status("REJECTED")
                    .approvedBy(latestDecision.getApproverId())
                    .comment(latestDecision.getComment())
                    .build();
            }
            
            log.info("审批通过 - orderId={}, approver={}", request.getOrderId(), currentApprover);
            // 清空决策，准备下一级
            latestDecision = null;
        }

        // 所有审批通过
        log.info("所有审批通过 - orderId={}", request.getOrderId());
        status = "APPROVED";
        activities.updateOrderApprovalStatus(request.getOrderId(), "APPROVED", currentApprover);
        return ApprovalResult.builder()
            .orderId(request.getOrderId())
            .status("APPROVED")
            .approvedBy(currentApprover)
            .comment("审批通过")
            .build();
    }

    @Override
    public void submitDecision(ApprovalDecision decision) {
        log.info("收到审批决策 - approverId={}, approved={}", decision.getApproverId(), decision.isApproved());
        this.latestDecision = decision;
    }

    @Override
    public String getApprovalStatus() {
        return status;
    }

    @Override
    public String getCurrentApprover() {
        return currentApprover;
    }
}
