package com.example.user.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 更新用户请求（全量替换或分配角色）
 */
@Data
public class UpdateUserRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 50)
    private String name;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @Size(max = 20)
    private String phone;

    private List<Long> roleIds;
}
