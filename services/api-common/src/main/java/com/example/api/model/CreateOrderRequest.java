package com.example.api.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.io.Serializable;

/**
 * 创建订单请求 DTO
 */
@Data
public class CreateOrderRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "用户 ID 不能为空")
    private Long userId;

    @NotBlank(message = "商品名称不能为空")
    private String productName;

    @NotNull(message = "价格不能为空")
    @Positive(message = "价格必须大于 0")
    private Double price;

    @Min(value = 1, message = "数量至少为 1")
    private Integer quantity = 1;
}
