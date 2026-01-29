package com.example.order.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体类（MyBatis）
 * 用于数据库持久化
 */
@Data
public class OrderEntity {

    private Long id;
    private Long userId;
    private String productName;
    private BigDecimal price;
    private Integer quantity;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
