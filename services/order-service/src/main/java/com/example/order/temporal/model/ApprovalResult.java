package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 审批结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalResult {
    private Long orderId;
    private String status; // APPROVED, REJECTED, TIMEOUT
    private String approvedBy;
    private String comment;
}
