package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 订单 Saga Workflow 输入参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSagaInput {
    private Long userId;
    private Long productId;
    private Integer quantity;
    private BigDecimal totalAmount;
    private String tenantId;
}
