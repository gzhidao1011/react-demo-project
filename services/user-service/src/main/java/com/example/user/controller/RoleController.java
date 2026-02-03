package com.example.user.controller;

import com.example.api.common.PagedResult;
import com.example.api.common.Result;
import com.example.user.controller.dto.CreateRoleRequest;
import com.example.user.controller.dto.RoleDetailDto;
import com.example.user.controller.dto.UpdateRolePermissionsRequest;
import com.example.user.controller.dto.UpdateRoleRequest;
import com.example.user.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 角色管理 API（与设计文档 2.4 一致）
 */
@RestController
@RequestMapping("/api/roles")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final UserManagementService userManagementService;

    public RoleController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * 分页查询角色（可选筛选 deleted，排序见 1.3）
     */
    @GetMapping
    public Result<PagedResult<RoleDetailDto>> getRoles(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "deleted", required = false) Boolean deleted,
            @RequestParam(name = "sort", required = false) String sort) {
        PagedResult<RoleDetailDto> paged = userManagementService.getRolesPage(page, size, deleted, sort);
        return Result.success(paged);
    }

    /**
     * 根据 ID 获取角色详情（含权限列表）
     */
    @GetMapping("/{id}")
    public Result<RoleDetailDto> getRoleById(@PathVariable("id") Long id) {
        RoleDetailDto dto = userManagementService.getRoleById(id);
        return Result.success(dto);
    }

    /**
     * 创建角色；成功返回 201 + Location
     */
    @PostMapping
    public ResponseEntity<Result<RoleDetailDto>> createRole(@Valid @RequestBody CreateRoleRequest request) {
        RoleDetailDto created = userManagementService.createRole(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header("Location", "/api/roles/" + created.getId())
                .body(Result.success(created));
    }

    /**
     * 更新角色
     */
    @PutMapping("/{id}")
    public Result<RoleDetailDto> updateRole(@PathVariable("id") Long id, @Valid @RequestBody UpdateRoleRequest request) {
        RoleDetailDto dto = userManagementService.updateRole(id, request);
        return Result.success(dto);
    }

    /**
     * 软删除角色；成功返回 204
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable("id") Long id) {
        userManagementService.softDeleteRole(id);
    }

    /**
     * 恢复软删除角色
     */
    @PatchMapping("/{id}/restore")
    public Result<Void> restoreRole(@PathVariable("id") Long id) {
        userManagementService.restoreRole(id);
        return Result.success();
    }

    /**
     * 为角色绑定权限（幂等替换）
     */
    @PutMapping("/{id}/permissions")
    public Result<Void> setRolePermissions(@PathVariable("id") Long id, @RequestBody UpdateRolePermissionsRequest request) {
        userManagementService.setRolePermissions(id, request.getPermissionIds() != null ? request.getPermissionIds() : java.util.Collections.emptyList());
        return Result.success();
    }
}
