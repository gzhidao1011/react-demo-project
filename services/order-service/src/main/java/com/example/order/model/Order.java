package com.example.order.model;

import lombok.Data;

import java.io.Serializable;

@Data  // Lombok 注解，自动生成 Getter、Setter、toString 等方法
public class Order implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Long id;
    private Long userId;  // 用户 ID
    private String productName;  // 商品名称
    private Double price;  // 价格
    private Integer quantity;  // 数量
    private String status;  // 订单状态
}
