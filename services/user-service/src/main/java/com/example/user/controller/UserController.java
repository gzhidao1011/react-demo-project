package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.User;
import com.example.api.service.UserService;
import com.example.user.entity.UserEntity;
import com.example.user.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
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
        if (userMapper.existsByEmail(user.getEmail())) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + user.getEmail());
        }

        var now = java.time.LocalDateTime.now();
        UserEntity entity = new UserEntity();
        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPhone(user.getPhone());
        entity.setPassword(passwordEncoder.encode("ChangeMe123!")); // 默认密码，建议用户修改
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        userMapper.insert(entity);
        return Result.success("用户创建成功", convertToDto(entity));
    }
    
    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public Result<User> updateUser(@PathVariable("id") Long id, @Valid @RequestBody User user) {
        UserEntity entity = userMapper.findById(id);
        if (entity == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        if (!entity.getEmail().equals(user.getEmail()) && userMapper.existsByEmail(user.getEmail())) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + user.getEmail());
        }

        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPhone(user.getPhone());
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        userMapper.update(entity);
        return Result.success("用户更新成功", convertToDto(entity));
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable("id") Long id) {
        if (!userMapper.existsById(id)) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        userMapper.deleteById(id);
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
