package com.example.user.service.impl;

import com.example.api.model.User;
import com.example.api.service.UserService;  // 直接使用共享接口
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@DubboService  // 标记为 Dubbo 服务，会被注册到注册中心
@Service
public class UserServiceImpl implements UserService {
    
    // 使用线程安全的 CopyOnWriteArrayList 替代 ArrayList
    private final List<User> users = new CopyOnWriteArrayList<>();
    
    public UserServiceImpl() {
        // 初始化测试数据
        User user1 = new User();
        user1.setId(1L);
        user1.setName("张三");
        user1.setEmail("zhangsan@example.com");
        user1.setPhone("13800138000");
        
        User user2 = new User();
        user2.setId(2L);
        user2.setName("李四");
        user2.setEmail("lisi@example.com");
        user2.setPhone("13900139000");
        
        users.add(user1);
        users.add(user2);
    }
    
    @Override
    public User getUserById(Long id) {
        return users.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
    
    @Override
    public List<User> getAllUsers() {
        return users;
    }
}
