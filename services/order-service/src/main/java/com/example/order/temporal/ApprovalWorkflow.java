package com.example.order.temporal;

import com.example.order.temporal.model.ApprovalDecision;
import com.example.order.temporal.model.ApprovalRequest;
import com.example.order.temporal.model.ApprovalResult;
import io.temporal.workflow.QueryMethod;
import io.temporal.workflow.SignalMethod;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * 订单审批 Workflow 接口
 * 支持多级审批链路，使用 Signal 接收人工审批决策
 */
@WorkflowInterface
public interface ApprovalWorkflow {

    @WorkflowMethod
    ApprovalResult submitForApproval(ApprovalRequest request);

    /**
     * Signal: 审批人提交决策
     */
    @SignalMethod
    void submitDecision(ApprovalDecision decision);

    /**
     * Query: 查询当前审批状态
     */
    @QueryMethod
    String getApprovalStatus();

    /**
     * Query: 查询当前待审批人
     */
    @QueryMethod
    String getCurrentApprover();
}
