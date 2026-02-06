package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 审批请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String tenantId;
    private String requestReason;
}
