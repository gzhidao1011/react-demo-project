package com.example.user.service.impl;

import com.example.api.model.User;
import com.example.api.service.UserService;
import com.example.user.entity.UserEntity;
import com.example.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户服务实现类
 * 使用 MySQL 数据库存储用户数据
 */
@DubboService(interfaceClass = UserService.class)  // 明确指定接口类，标记为 Dubbo 服务
@Service
public class UserServiceImpl implements UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 初始化测试数据
     * 仅在数据库为空时添加
     */
    @PostConstruct
    public void initData() {
        if (userRepository.count() == 0) {
            UserEntity user1 = new UserEntity();
            user1.setName("张三");
            user1.setEmail("zhangsan@example.com");
            user1.setPhone("13800138000");
            
            UserEntity user2 = new UserEntity();
            user2.setName("李四");
            user2.setEmail("lisi@example.com");
            user2.setPhone("13900139000");
            
            userRepository.save(user1);
            userRepository.save(user2);
        }
    }
    
    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDto)
                .orElse(null);
    }
    
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 将实体类转换为 DTO
     */
    private User convertToDto(UserEntity entity) {
        User user = new User();
        user.setId(entity.getId());
        user.setName(entity.getName());
        user.setEmail(entity.getEmail());
        user.setPhone(entity.getPhone());
        return user;
    }
    
    /**
     * 将 DTO 转换为实体类
     */
    private UserEntity convertToEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPhone(user.getPhone());
        return entity;
    }
}
