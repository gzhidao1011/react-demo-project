package com.example.order.temporal;

import com.example.order.temporal.model.OrderSagaInput;
import com.example.order.temporal.model.OrderSagaResult;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * 订单 Saga Workflow 接口
 * 使用 Saga 模式编排订单创建的分布式事务
 */
@WorkflowInterface
public interface OrderSagaWorkflow {

    @WorkflowMethod
    OrderSagaResult createOrder(OrderSagaInput input);
}
