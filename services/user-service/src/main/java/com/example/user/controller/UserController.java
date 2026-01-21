package com.example.user.controller;

import com.example.api.model.User;
import com.example.api.service.UserService;
import com.example.user.entity.UserEntity;
import com.example.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    
    /**
     * 根据 ID 获取用户
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * 创建用户
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        // 参数校验
        if (user.getName() == null || user.getName().isBlank()) {
            return ResponseEntity.badRequest().body("用户名不能为空");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("邮箱不能为空");
        }
        
        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("邮箱已存在: " + user.getEmail());
        }
        
        UserEntity entity = new UserEntity();
        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPhone(user.getPhone());
        
        UserEntity saved = userRepository.save(entity);
        
        User result = new User();
        result.setId(saved.getId());
        result.setName(saved.getName());
        result.setEmail(saved.getEmail());
        result.setPhone(saved.getPhone());
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable("id") Long id, @RequestBody User user) {
        return userRepository.findById(id)
                .map(entity -> {
                    entity.setName(user.getName());
                    entity.setEmail(user.getEmail());
                    entity.setPhone(user.getPhone());
                    UserEntity saved = userRepository.save(entity);
                    
                    User result = new User();
                    result.setId(saved.getId());
                    result.setName(saved.getName());
                    result.setEmail(saved.getEmail());
                    result.setPhone(saved.getPhone());
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}