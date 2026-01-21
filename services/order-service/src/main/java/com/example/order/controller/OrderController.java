package com.example.order.controller;

import com.example.api.model.User;
import com.example.api.service.UserService;  // 直接使用共享接口
import com.example.order.model.Order;
import org.apache.dubbo.config.annotation.DubboReference;  // Dubbo 引用注解
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @DubboReference  // 引用远程服务，Dubbo 会自动从注册中心查找服务
    private UserService userService;  // 注入远程服务
    
    // 使用线程安全的 CopyOnWriteArrayList 替代 ArrayList
    private final List<Order> orders = new CopyOnWriteArrayList<>();
    
    // 使用 AtomicLong 保证 ID 生成的线程安全
    private final AtomicLong idGenerator = new AtomicLong(0);
    
    @GetMapping
    public List<Order> getAllOrders() {
        return orders;
    }
    
    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
        return orders.stream()
                .filter(o -> o.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
    
    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        // 验证用户是否存在
        User user = userService.getUserById(order.getUserId());
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        
        order.setId(idGenerator.incrementAndGet());
        order.setStatus("待支付");
        orders.add(order);
        return order;
    }
}