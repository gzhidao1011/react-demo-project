package com.example.demo.model;

public class User {
    private Long id;
    private String name;
    private String email;
    
    // 无参构造函数（Java 默认提供，但显式声明更清晰）
    public User() {
    }
    
    // 带参构造函数（可选）
    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    
    // Getter 和 Setter 方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
}