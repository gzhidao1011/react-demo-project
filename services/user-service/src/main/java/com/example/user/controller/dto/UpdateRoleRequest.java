package com.example.user.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新角色请求
 */
@Data
public class UpdateRoleRequest {
    @NotBlank(message = "角色名称不能为空")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "角色编码不能为空")
    @Size(max = 50)
    private String code;

    @Size(max = 255)
    private String description;
}
