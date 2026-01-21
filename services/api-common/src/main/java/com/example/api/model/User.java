package com.example.api.model;

import lombok.Data;

import java.io.Serializable;

/**
 * 用户模型类（共享）
 * 用于服务间传递用户数据
 * 实现 Serializable 接口以支持 Dubbo RPC 序列化传输
 */
@Data  // Lombok 注解，自动生成 Getter、Setter、toString 等方法
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String email;
    private String phone;
}
