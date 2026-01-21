package com.example.demo.controller;
import com.example.demo.model.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Microservices!123";
    }
    
    @GetMapping("/user")
    public User getUser() {
        User user = new User();
        user.setId(1L);
        user.setName("张三");
        user.setEmail("zhangsan@example.com");
        return user;
    }
}