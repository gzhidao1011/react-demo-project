package com.example.user.controller;

import com.example.api.common.Result;
import com.example.user.controller.dto.PermissionDto;
import com.example.user.service.UserManagementService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 权限管理 API（与设计文档 2.4 一致）
 * GET /api/permissions 列表（只读/预定义）
 */
@RestController
@RequestMapping("/api/permissions")
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {

    private final UserManagementService userManagementService;

    public PermissionController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public Result<List<PermissionDto>> getPermissions() {
        List<PermissionDto> list = userManagementService.getPermissions();
        return Result.success(list);
    }
}
