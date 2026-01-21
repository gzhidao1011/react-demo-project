package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.User;
import com.example.api.service.UserService;
import com.example.user.entity.UserEntity;
import com.example.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户控制器
 * 提供用户 REST API
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 获取所有用户
     */
    @GetMapping
    public Result<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return Result.success(users);
    }
    
    /**
     * 根据 ID 获取用户
     */
    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable("id") Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        return Result.success(user);
    }
    
    /**
     * 创建用户
     */
    @PostMapping
    public Result<User> createUser(@Valid @RequestBody User user) {
        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + user.getEmail());
        }
        
        UserEntity entity = new UserEntity();
        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPhone(user.getPhone());
        
        UserEntity saved = userRepository.save(entity);
        
        User result = convertToDto(saved);
        return Result.success("用户创建成功", result);
    }
    
    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public Result<User> updateUser(@PathVariable("id") Long id, @Valid @RequestBody User user) {
        UserEntity entity = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));
        
        // 如果修改了邮箱，检查新邮箱是否已被其他用户使用
        if (!entity.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(user.getEmail())) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + user.getEmail());
        }
        
        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPhone(user.getPhone());
        UserEntity saved = userRepository.save(entity);
        
        User result = convertToDto(saved);
        return Result.success("用户更新成功", result);
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable("id") Long id) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        userRepository.deleteById(id);
        return Result.success();
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
}
