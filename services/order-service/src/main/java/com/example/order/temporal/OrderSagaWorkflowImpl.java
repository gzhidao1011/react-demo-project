package com.example.order.temporal;

import com.example.order.temporal.model.OrderSagaInput;
import com.example.order.temporal.model.OrderSagaResult;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.failure.ActivityFailure;
import io.temporal.workflow.Saga;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;

/**
 * 订单 Saga Workflow 实现
 * 
 * 执行流程:
 * 1. 创建订单 (待支付状态)
 * 2. 预留库存
 * 3. 扣减余额  
 * 4. 确认订单
 * 
 * 任何步骤失败都会触发已完成步骤的补偿
 */
public class OrderSagaWorkflowImpl implements OrderSagaWorkflow {

    private static final Logger log = Workflow.getLogger(OrderSagaWorkflowImpl.class);

    // Activity 配置：重试3次，每次间隔1秒
    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofSeconds(30))
        .setRetryOptions(RetryOptions.newBuilder()
            .setMaximumAttempts(3)
            .setInitialInterval(Duration.ofSeconds(1))
            .build())
        .build();

    private final OrderActivities activities = 
        Workflow.newActivityStub(OrderActivities.class, activityOptions);

    @Override
    public OrderSagaResult createOrder(OrderSagaInput input) {
        // Saga 配置：支持并行补偿
        Saga.Options sagaOptions = new Saga.Options.Builder()
            .setParallelCompensation(true)
            .build();
        Saga saga = new Saga(sagaOptions);

        try {
            // Step 1: 创建订单
            log.info("Step 1: 创建订单 - userId={}, productId={}", input.getUserId(), input.getProductId());
            Long orderId = activities.createOrder(
                input.getUserId(),
                input.getProductId(), 
                input.getQuantity(),
                input.getTotalAmount(),
                input.getTenantId()
            );
            // 注册补偿：取消订单
            saga.addCompensation(activities::cancelOrder, orderId);

            // Step 2: 预留库存
            log.info("Step 2: 预留库存 - productId={}, quantity={}", input.getProductId(), input.getQuantity());
            boolean inventoryReserved = activities.reserveInventory(
                input.getProductId(),
                input.getQuantity(),
                input.getTenantId()
            );
            if (!inventoryReserved) {
                throw new RuntimeException("库存不足");
            }
            // 注册补偿：释放库存
            saga.addCompensation(
                activities::releaseInventory,
                input.getProductId(),
                input.getQuantity(),
                input.getTenantId()
            );

            // Step 3: 扣减用户余额
            log.info("Step 3: 扣减余额 - userId={}, amount={}", input.getUserId(), input.getTotalAmount());
            boolean balanceDeducted = activities.deductBalance(
                input.getUserId(),
                input.getTotalAmount(),
                input.getTenantId()
            );
            if (!balanceDeducted) {
                throw new RuntimeException("余额不足");
            }
            // 注册补偿：退还余额
            saga.addCompensation(
                activities::refundBalance,
                input.getUserId(),
                input.getTotalAmount(),
                input.getTenantId()
            );

            // Step 4: 确认订单
            log.info("Step 4: 确认订单 - orderId={}", orderId);
            activities.confirmOrder(orderId);

            log.info("订单 Saga 执行成功 - orderId={}", orderId);
            return OrderSagaResult.builder()
                .orderId(orderId)
                .status("COMPLETED")
                .message("订单创建成功")
                .success(true)
                .build();

        } catch (ActivityFailure e) {
            log.error("订单 Saga 执行失败，开始补偿: {}", e.getCause().getMessage());
            // 执行所有补偿操作
            saga.compensate();
            
            return OrderSagaResult.builder()
                .status("COMPENSATED")
                .message("订单创建失败: " + e.getCause().getMessage())
                .success(false)
                .build();
        } catch (Exception e) {
            log.error("订单 Saga 执行异常，开始补偿: {}", e.getMessage());
            saga.compensate();
            
            return OrderSagaResult.builder()
                .status("COMPENSATED")
                .message("订单创建失败: " + e.getMessage())
                .success(false)
                .build();
        }
    }
}
