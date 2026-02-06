package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 订单 Saga Workflow 执行结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSagaResult {
    private Long orderId;
    private String status;
    private String message;
    private boolean success;
}
