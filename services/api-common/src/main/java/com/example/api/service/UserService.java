package com.example.api.service;

import com.example.api.model.User;

import java.util.List;

/**
 * 用户服务接口（共享）
 * 用于定义 Dubbo 服务接口，供服务提供者和消费者使用
 */
public interface UserService {
    /**
     * 根据 ID 获取用户
     */
    User getUserById(Long id);
    
    /**
     * 获取所有用户
     */
    List<User> getAllUsers();
}
