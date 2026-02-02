package com.example.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现，注册到 Nacos
@EnableScheduling  // 启用定时任务（密码重置 Token 清理等）
@ComponentScan(basePackages = {"com.example.user", "com.example.api.exception"})  // 扫描全局异常处理器
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}