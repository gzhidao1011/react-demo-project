package com.example.order.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.CreateOrderRequest;
import com.example.api.model.User;
import com.example.api.service.UserService;
import com.example.order.entity.OrderEntity;
import com.example.order.mapper.OrderMapper;
import com.example.order.model.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 订单控制器
 * 提供订单 REST API
 */
@RestController
@RequestMapping("/api/orders")
@Validated  // 启用方法级别的参数校验
public class OrderController {
    
    @DubboReference  // 引用远程服务，Dubbo 会自动从注册中心查找服务
    private UserService userService;
    
    @Autowired
    private OrderMapper orderMapper;
    
    /**
     * 获取所有订单
     */
    @GetMapping
    public Result<List<Order>> getAllOrders() {
        List<Order> orders = orderMapper.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return Result.success(orders);
    }
    
    /**
     * 根据 ID 获取订单
     */
    @GetMapping("/{id}")
    public Result<Order> getOrderById(@PathVariable("id") Long id) {
        OrderEntity entity = orderMapper.findById(id);
        if (entity == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_FOUND);
        }
        return Result.success(convertToDto(entity));
    }
    
    /**
     * 根据用户 ID 获取订单
     */
    @GetMapping("/user/{userId}")
    public Result<List<Order>> getOrdersByUserId(@PathVariable("userId") Long userId) {
        List<Order> orders = orderMapper.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return Result.success(orders);
    }
    
    /**
     * 创建订单
     */
    @PostMapping
    public Result<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        // 验证用户是否存在
        User user = userService.getUserById(request.getUserId());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND, "用户不存在，无法创建订单");
        }
        
        var now = java.time.LocalDateTime.now();
        OrderEntity entity = new OrderEntity();
        entity.setUserId(request.getUserId());
        entity.setProductName(request.getProductName());
        entity.setPrice(BigDecimal.valueOf(request.getPrice()));
        entity.setQuantity(request.getQuantity() != null ? request.getQuantity() : 1);
        entity.setStatus("待支付");
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        orderMapper.insert(entity);
        return Result.success("订单创建成功", convertToDto(entity));
    }
    
    /**
     * 更新订单状态
     */
    @PutMapping("/{id}/status")
    public Result<Order> updateOrderStatus(
            @PathVariable("id") Long id, 
            @RequestParam("status") @NotBlank(message = "订单状态不能为空") String status) {
        
        // 校验状态值是否合法
        if (!isValidStatus(status)) {
            throw new BusinessException(ResultCode.ORDER_STATUS_ERROR, "无效的订单状态: " + status);
        }
        
        OrderEntity entity = orderMapper.findById(id);
        if (entity == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_FOUND);
        }
        entity.setStatus(status);
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        orderMapper.update(entity);
        return Result.success("订单状态更新成功", convertToDto(entity));
    }
    
    /**
     * 删除订单
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteOrder(@PathVariable("id") Long id) {
        if (!orderMapper.existsById(id)) {
            throw new BusinessException(ResultCode.ORDER_NOT_FOUND);
        }
        orderMapper.deleteById(id);
        return Result.success();
    }
    
    /**
     * 将实体类转换为 DTO
     */
    private Order convertToDto(OrderEntity entity) {
        Order order = new Order();
        order.setId(entity.getId());
        order.setUserId(entity.getUserId());
        order.setProductName(entity.getProductName());
        order.setPrice(entity.getPrice().doubleValue());
        order.setQuantity(entity.getQuantity());
        order.setStatus(entity.getStatus());
        return order;
    }
    
    /**
     * 校验订单状态是否合法
     */
    private boolean isValidStatus(String status) {
        return status != null && (
                "待支付".equals(status) ||
                "已支付".equals(status) ||
                "已发货".equals(status) ||
                "已完成".equals(status) ||
                "已取消".equals(status)
        );
    }
}
