package com.example.order.controller;

import com.example.api.common.Result;
import com.example.order.temporal.ApprovalWorkflow;
import com.example.order.temporal.model.ApprovalDecision;
import com.example.order.temporal.model.ApprovalRequest;
import com.example.order.temporal.model.ApprovalResult;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * 审批 Controller
 * 管理订单审批工作流
 */
@RestController
@RequestMapping("/api/approvals")
@Slf4j
@ConditionalOnBean(WorkflowClient.class)
public class ApprovalController {

    @Autowired
    private WorkflowClient workflowClient;

    /**
     * 提交审批
     */
    @PostMapping("/submit")
    public ResponseEntity<Result<Map<String, String>>> submitApproval(@RequestBody ApprovalRequest request) {
        log.info("提交审批 - orderId={}, amount={}", request.getOrderId(), request.getAmount());
        
        String workflowId = "approval-" + request.getOrderId() + "-" + UUID.randomUUID();
        
        WorkflowOptions options = WorkflowOptions.newBuilder()
            .setTaskQueue("approval-queue")
            .setWorkflowId(workflowId)
            .setWorkflowExecutionTimeout(Duration.ofDays(7))  // 审批最长7天
            .build();

        ApprovalWorkflow workflow = workflowClient.newWorkflowStub(ApprovalWorkflow.class, options);
        
        // 异步启动 Workflow
        WorkflowClient.start(workflow::submitForApproval, request);
        
        return ResponseEntity.ok(Result.success(Map.of(
            "workflowId", workflowId,
            "message", "审批已提交"
        )));
    }

    /**
     * 审批人提交决策
     */
    @PostMapping("/{workflowId}/decide")
    public ResponseEntity<Result<String>> submitDecision(
            @PathVariable String workflowId,
            @RequestBody ApprovalDecision decision) {
        
        log.info("提交审批决策 - workflowId={}, approverId={}, approved={}", 
                workflowId, decision.getApproverId(), decision.isApproved());
        
        ApprovalWorkflow workflow = workflowClient.newWorkflowStub(ApprovalWorkflow.class, workflowId);
        workflow.submitDecision(decision);
        
        return ResponseEntity.ok(Result.success("决策已提交"));
    }

    /**
     * 查询审批状态
     */
    @GetMapping("/{workflowId}/status")
    public ResponseEntity<Result<Map<String, String>>> getApprovalStatus(@PathVariable String workflowId) {
        log.info("查询审批状态 - workflowId={}", workflowId);
        
        ApprovalWorkflow workflow = workflowClient.newWorkflowStub(ApprovalWorkflow.class, workflowId);
        
        String status = workflow.getApprovalStatus();
        String currentApprover = workflow.getCurrentApprover();
        
        return ResponseEntity.ok(Result.success(Map.of(
            "status", status,
            "currentApprover", currentApprover != null ? currentApprover : "N/A"
        )));
    }

    /**
     * 获取审批结果
     */
    @GetMapping("/{workflowId}/result")
    public ResponseEntity<Result<ApprovalResult>> getApprovalResult(@PathVariable String workflowId) {
        log.info("获取审批结果 - workflowId={}", workflowId);
        
        WorkflowStub workflowStub = workflowClient.newUntypedWorkflowStub(workflowId);
        
        // 等待 Workflow 完成并获取结果
        ApprovalResult result = workflowStub.getResult(ApprovalResult.class);
        
        return ResponseEntity.ok(Result.success(result));
    }
}
