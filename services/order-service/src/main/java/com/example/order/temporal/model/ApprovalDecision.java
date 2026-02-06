package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 审批决策
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDecision {
    private String approverId;
    private boolean approved;
    private String comment;
}
