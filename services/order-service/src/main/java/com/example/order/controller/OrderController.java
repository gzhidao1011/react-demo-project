package com.example.order.controller;

import com.example.api.model.User;
import com.example.api.service.UserService;
import com.example.order.entity.OrderEntity;
import com.example.order.model.Order;
import com.example.order.repository.OrderRepository;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
public class OrderController {
    
    @DubboReference  // 引用远程服务，Dubbo 会自动从注册中心查找服务
    private UserService userService;
    
    @Autowired
    private OrderRepository orderRepository;
    
    /**
     * 获取所有订单
     */
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 根据 ID 获取订单
     */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable("id") Long id) {
        return orderRepository.findById(id)
                .map(entity -> ResponseEntity.ok(convertToDto(entity)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 根据用户 ID 获取订单
     */
    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUserId(@PathVariable("userId") Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 创建订单
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        // 验证用户是否存在
        User user = userService.getUserById(order.getUserId());
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        OrderEntity entity = new OrderEntity();
        entity.setUserId(order.getUserId());
        entity.setProductName(order.getProductName());
        entity.setPrice(BigDecimal.valueOf(order.getPrice()));
        entity.setQuantity(order.getQuantity() != null ? order.getQuantity() : 1);
        entity.setStatus("待支付");
        
        OrderEntity saved = orderRepository.save(entity);
        return ResponseEntity.ok(convertToDto(saved));
    }
    
    /**
     * 更新订单状态
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable("id") Long id, @RequestParam("status") String status) {
        return orderRepository.findById(id)
                .map(entity -> {
                    entity.setStatus(status);
                    OrderEntity saved = orderRepository.save(entity);
                    return ResponseEntity.ok(convertToDto(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 删除订单
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable("id") Long id) {
        if (!orderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        orderRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
}