package com.example.user.controller;

import com.example.api.common.PagedResult;
import com.example.api.common.Result;
import com.example.user.controller.dto.CreateUserRequest;
import com.example.user.controller.dto.UpdateUserRequest;
import com.example.user.controller.dto.UserDetailDto;
import com.example.user.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理 API（与设计文档 2.4 一致）
 * 分页、软删除、恢复；需 ADMIN 角色
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * 分页查询用户（可选筛选 email/name/role/deleted，排序见 1.3）
     */
    @GetMapping
    public Result<PagedResult<UserDetailDto>> getUsers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "deleted", required = false) Boolean deleted,
            @RequestParam(name = "sort", required = false) String sort) {
        PagedResult<UserDetailDto> paged = userManagementService.getUsersPage(page, size, email, name, role, deleted, sort);
        return Result.success(paged);
    }

    /**
     * 根据 ID 获取用户详情（含角色列表）
     */
    @GetMapping("/{id}")
    public Result<UserDetailDto> getUserById(@PathVariable("id") Long id) {
        UserDetailDto dto = userManagementService.getUserById(id);
        return Result.success(dto);
    }

    /**
     * 创建用户（可指定初始角色）；成功返回 201 + Location
     */
    @PostMapping
    public ResponseEntity<Result<UserDetailDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDetailDto created = userManagementService.createUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header("Location", "/api/users/" + created.getId())
                .body(Result.success(created));
    }

    /**
     * 更新用户与/或分配角色
     */
    @PutMapping("/{id}")
    public Result<UserDetailDto> updateUser(@PathVariable("id") Long id, @Valid @RequestBody UpdateUserRequest request) {
        UserDetailDto dto = userManagementService.updateUser(id, request);
        return Result.success(dto);
    }

    /**
     * 软删除用户；成功返回 204 No Content
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable("id") Long id) {
        userManagementService.softDeleteUser(id);
    }

    /**
     * 恢复软删除用户
     */
    @PatchMapping("/{id}/restore")
    public Result<Void> restoreUser(@PathVariable("id") Long id) {
        userManagementService.restoreUser(id);
        return Result.success();
    }
}
