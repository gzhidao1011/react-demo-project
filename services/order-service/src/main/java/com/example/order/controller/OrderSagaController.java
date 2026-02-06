package com.example.order.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.order.temporal.OrderSagaWorkflow;
import com.example.order.temporal.model.OrderSagaInput;
import com.example.order.temporal.model.OrderSagaResult;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;

/**
 * 订单 Saga Controller
 * 使用 Temporal Saga 创建订单
 */
@RestController
@RequestMapping("/api/orders/saga")
@Slf4j
@ConditionalOnBean(WorkflowClient.class)
public class OrderSagaController {

    @Autowired
    private WorkflowClient workflowClient;

    /**
     * 使用 Saga 模式创建订单
     */
    @PostMapping
    public ResponseEntity<Result<OrderSagaResult>> createOrderWithSaga(
            @RequestParam Long userId,
            @RequestParam Long productId,
            @RequestParam Integer quantity,
            @RequestParam BigDecimal totalAmount,
            @RequestHeader(value = "X-Tenant-ID", required = false, defaultValue = "default") String tenantId) {

        log.info("创建订单 Saga - userId={}, productId={}, quantity={}, amount={}, tenantId={}", 
                userId, productId, quantity, totalAmount, tenantId);

        // 构建 Workflow 输入
        OrderSagaInput input = OrderSagaInput.builder()
            .userId(userId)
            .productId(productId)
            .quantity(quantity)
            .totalAmount(totalAmount)
            .tenantId(tenantId)
            .build();

        // 创建 Workflow 选项
        WorkflowOptions options = WorkflowOptions.newBuilder()
            .setTaskQueue("order-saga-queue")
            .setWorkflowId("order-saga-" + UUID.randomUUID())
            .setWorkflowExecutionTimeout(Duration.ofMinutes(5))
            .build();

        // 创建并启动 Workflow
        OrderSagaWorkflow workflow = workflowClient.newWorkflowStub(
            OrderSagaWorkflow.class, options);

        // 同步执行 Workflow
        OrderSagaResult result = workflow.createOrder(input);

        if (result.isSuccess()) {
            return ResponseEntity.ok(Result.success("订单创建成功", result));
        }
        return ResponseEntity.badRequest().body(Result.error(ResultCode.BAD_REQUEST, result.getMessage()));
    }
}
