package com.example.api.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 50, message = "用户名长度必须在 2-50 个字符之间")
    private String name;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @Size(max = 20, message = "手机号长度不能超过 20 个字符")
    private String phone;
}
