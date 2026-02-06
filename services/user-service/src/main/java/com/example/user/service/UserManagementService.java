package com.example.user.service;

import com.example.api.common.PagedResult;
import com.example.api.exception.BusinessException;
import com.example.api.common.ResultCode;
import com.example.user.controller.dto.*;
import com.example.user.entity.*;
import com.example.user.event.UserEventPublisher;
import com.example.user.mapper.*;
import java.util.Optional;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 用户/角色/权限管理服务（与设计文档 2.4、2.7 一致）
 * 管理 API 含分页、软删除、恢复；敏感操作写入审计日志（谁在何时对何资源做了何操作）
 */
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final int AUDIT_VALUE_MAX_LENGTH = 1000;

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final PermissionMapper permissionMapper;
    private final UserRoleMapper userRoleMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final AuditLogMapper auditLogMapper;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final Optional<UserEventPublisher> userEventPublisher;

    private static final int MAX_PAGE_SIZE = 100;
    private static final List<String> USER_SORT_WHITELIST = List.of("createdAt", "email", "name");
    private static final List<String> ROLE_SORT_WHITELIST = List.of("createdAt", "code", "name");

    // ========== 用户管理 ==========

    public PagedResult<UserDetailDto> getUsersPage(int page, int size, String email, String name, String roleCode, Boolean includeDeleted, String sort) {
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        int safePage = Math.max(1, page);
        long offset = (long) (safePage - 1) * safeSize;
        String orderBy = toOrderBy(sort, USER_SORT_WHITELIST, "u");
        if (orderBy == null) orderBy = "u.created_at DESC";

        List<UserEntity> list = userMapper.findPage(email, name, roleCode, includeDeleted, offset, safeSize, orderBy);
        long total = userMapper.countPage(email, name, roleCode, includeDeleted);
        List<UserDetailDto> items = list.stream().map(this::toUserDetailDto).collect(Collectors.toList());
        return PagedResult.of(items, total, safePage, safeSize);
    }

    public UserDetailDto getUserById(Long id) {
        UserEntity entity = userMapper.findByIdExcludingDeleted(id);
        if (entity == null) throw new BusinessException(ResultCode.USER_NOT_FOUND);
        return toUserDetailDto(entity);
    }

    @Transactional
    public UserDetailDto createUser(CreateUserRequest request) {
        if (userMapper.existsByEmailWithDeleted(request.getEmail(), true))
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + request.getEmail());
        var now = LocalDateTime.now();
        UserEntity entity = new UserEntity();
        entity.setName(request.getName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setPassword(passwordEncoder.encode(request.getPassword()));
        entity.setEmailVerified(false);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setDeletedAt(null);
        userMapper.insert(entity);
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            for (Long roleId : request.getRoleIds()) {
                if (roleMapper.findById(roleId) != null)
                    userRoleMapper.insert(entity.getId(), roleId, now);
            }
        }
        UserEntity created = userMapper.findById(entity.getId());
        writeAudit("user.created", "user", String.valueOf(created.getId()), null, userSnapshot(created));
        
        // 发布用户创建事件 (Phase 2 事件驱动)
        userEventPublisher.ifPresent(pub -> pub.publishUserCreated(created.getId(), created.getName(), created.getEmail(), "admin-create"));
        
        return toUserDetailDto(created);
    }

    @Transactional
    public UserDetailDto updateUser(Long id, UpdateUserRequest request) {
        UserEntity entity = userMapper.findByIdExcludingDeleted(id);
        if (entity == null) throw new BusinessException(ResultCode.USER_NOT_FOUND);
        String oldSnapshot = userSnapshot(entity);
        if (!entity.getEmail().equals(request.getEmail()) && userMapper.existsByEmailWithDeleted(request.getEmail(), true))
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + request.getEmail());
        entity.setName(request.getName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setUpdatedAt(LocalDateTime.now());
        userMapper.update(entity);
        if (request.getRoleIds() != null) {
            userRoleMapper.deleteByUserId(id);
            var now = LocalDateTime.now();
            for (Long roleId : request.getRoleIds()) {
                if (roleMapper.findById(roleId) != null)
                    userRoleMapper.insert(id, roleId, now);
            }
        }
        UserEntity updated = userMapper.findById(id);
        writeAudit("user.updated", "user", String.valueOf(id), oldSnapshot, userSnapshot(updated));
        return toUserDetailDto(updated);
    }

    @Transactional
    public void softDeleteUser(Long id) {
        UserEntity entity = userMapper.findByIdExcludingDeleted(id);
        if (entity == null) throw new BusinessException(ResultCode.USER_NOT_FOUND);
        String oldSnapshot = userSnapshot(entity);
        var now = LocalDateTime.now();
        userMapper.softDeleteById(id, now);
        writeAudit("user.deleted", "user", String.valueOf(id), oldSnapshot, null);
    }

    @Transactional
    public void restoreUser(Long id) {
        UserEntity entity = userMapper.findById(id);
        if (entity == null) throw new BusinessException(ResultCode.USER_NOT_FOUND);
        if (entity.getDeletedAt() == null) return;
        userMapper.restoreById(id);
        UserEntity restored = userMapper.findById(id);
        writeAudit("user.restored", "user", String.valueOf(id), null, userSnapshot(restored));
    }

    // ========== 角色管理 ==========

    public PagedResult<RoleDetailDto> getRolesPage(int page, int size, Boolean includeDeleted, String sort) {
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        int safePage = Math.max(1, page);
        boolean inc = includeDeleted != null && includeDeleted;
        List<RoleEntity> list = roleMapper.findAll(inc);
        long total = roleMapper.count(inc);
        int from = (safePage - 1) * safeSize;
        int to = Math.min(from + safeSize, list.size());
        List<RoleDetailDto> items = (from < list.size())
                ? list.subList(from, to).stream().map(this::toRoleDetailDto).collect(Collectors.toList())
                : new ArrayList<>();
        return PagedResult.of(items, total, safePage, safeSize);
    }

    public RoleDetailDto getRoleById(Long id) {
        RoleEntity entity = roleMapper.findById(id);
        if (entity == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "角色不存在");
        return toRoleDetailDto(entity);
    }

    @Transactional
    public RoleDetailDto createRole(CreateRoleRequest request) {
        if (roleMapper.findByCode(request.getCode(), true) != null)
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "角色编码已存在: " + request.getCode());
        var now = LocalDateTime.now();
        RoleEntity entity = new RoleEntity();
        entity.setName(request.getName());
        entity.setCode(request.getCode());
        entity.setDescription(request.getDescription());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setDeletedAt(null);
        roleMapper.insert(entity);
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            for (Long permId : request.getPermissionIds()) {
                if (permissionMapper.findById(permId) != null)
                    rolePermissionMapper.insert(entity.getId(), permId, now);
            }
        }
        RoleEntity created = roleMapper.findById(entity.getId());
        writeAudit("role.created", "role", String.valueOf(created.getId()), null, roleSnapshot(created));
        return toRoleDetailDto(created);
    }

    @Transactional
    public RoleDetailDto updateRole(Long id, UpdateRoleRequest request) {
        RoleEntity entity = roleMapper.findById(id);
        if (entity == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "角色不存在");
        RoleEntity existing = roleMapper.findByCode(request.getCode(), true);
        if (existing != null && !existing.getId().equals(id))
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "角色编码已存在: " + request.getCode());
        entity.setName(request.getName());
        entity.setCode(request.getCode());
        entity.setDescription(request.getDescription());
        entity.setUpdatedAt(LocalDateTime.now());
        roleMapper.update(entity);
        RoleEntity updated = roleMapper.findById(id);
        writeAudit("role.updated", "role", String.valueOf(id), null, roleSnapshot(updated));
        return toRoleDetailDto(updated);
    }

    @Transactional
    public void softDeleteRole(Long id) {
        RoleEntity entity = roleMapper.findById(id);
        if (entity == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "角色不存在");
        String oldSnapshot = roleSnapshot(entity);
        roleMapper.softDelete(id, LocalDateTime.now());
        writeAudit("role.deleted", "role", String.valueOf(id), oldSnapshot, null);
    }

    @Transactional
    public void restoreRole(Long id) {
        RoleEntity entity = roleMapper.findByIdIncludingDeleted(id);
        if (entity == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "角色不存在");
        if (entity.getDeletedAt() == null) return;
        roleMapper.restore(id);
        RoleEntity restored = roleMapper.findById(id);
        writeAudit("role.restored", "role", String.valueOf(id), null, roleSnapshot(restored));
    }

    @Transactional
    public void setRolePermissions(Long roleId, List<Long> permissionIds) {
        RoleEntity role = roleMapper.findById(roleId);
        if (role == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "角色不存在");
        rolePermissionMapper.deleteByRoleId(roleId);
        if (permissionIds != null && !permissionIds.isEmpty()) {
            var now = LocalDateTime.now();
            for (Long permId : permissionIds) {
                if (permissionMapper.findById(permId) != null)
                    rolePermissionMapper.insert(roleId, permId, now);
            }
        }
        // 将权限ID列表转换为有效的 JSON 格式（数据库字段为 JSON 类型）
        String newValue;
        try {
            Map<String, Object> auditData = new LinkedHashMap<>();
            auditData.put("permissionIds", permissionIds != null ? permissionIds : List.of());
            newValue = objectMapper.writeValueAsString(auditData);
        } catch (JsonProcessingException ex) {
            // 如果 JSON 序列化失败，使用简单的字符串格式（虽然不符合 JSON 类型，但至少不会导致插入失败）
            newValue = "permissionIds=" + (permissionIds != null ? permissionIds : List.of());
        }
        writeAudit("role.permissions.updated", "role", String.valueOf(roleId), null, newValue);
    }

    // ========== 权限管理 ==========

    public List<PermissionDto> getPermissions() {
        return permissionMapper.findAll().stream().map(this::toPermissionDto).collect(Collectors.toList());
    }

    // ========== 内部辅助 ==========

    private UserDetailDto toUserDetailDto(UserEntity e) {
        UserDetailDto dto = new UserDetailDto();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setEmail(e.getEmail());
        dto.setPhone(e.getPhone());
        dto.setEmailVerified(e.getEmailVerified());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        dto.setDeletedAt(e.getDeletedAt());
        List<Long> roleIds = userRoleMapper.findRoleIdsByUserId(e.getId());
        List<RoleSummaryDto> roles = roleIds.stream()
                .map(roleMapper::findById)
                .filter(r -> r != null)
                .map(r -> {
                    RoleSummaryDto s = new RoleSummaryDto();
                    s.setId(r.getId());
                    s.setCode(r.getCode());
                    s.setName(r.getName());
                    return s;
                })
                .collect(Collectors.toList());
        dto.setRoles(roles);
        return dto;
    }

    private RoleDetailDto toRoleDetailDto(RoleEntity e) {
        RoleDetailDto dto = new RoleDetailDto();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setCode(e.getCode());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        dto.setDeletedAt(e.getDeletedAt());
        List<Long> permIds = rolePermissionMapper.findPermissionIdsByRoleId(e.getId());
        List<PermissionDto> perms = permIds.stream()
                .map(permissionMapper::findById)
                .filter(p -> p != null)
                .map(this::toPermissionDto)
                .collect(Collectors.toList());
        dto.setPermissions(perms);
        return dto;
    }

    private PermissionDto toPermissionDto(PermissionEntity e) {
        PermissionDto dto = new PermissionDto();
        dto.setId(e.getId());
        dto.setResource(e.getResource());
        dto.setAction(e.getAction());
        dto.setDescription(e.getDescription());
        return dto;
    }

    private String toOrderBy(String sort, List<String> whitelist, String prefix) {
        if (sort == null || sort.isBlank()) return null;
        String[] parts = sort.split(",");
        if (parts.length < 1) return null;
        String field = parts[0].trim();
        String dir = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()) ? "ASC" : "DESC";
        String dbField = "createdAt".equals(field) ? "created_at" : "email".equals(field) ? "email" : "name".equals(field) ? "name" : null;
        if (dbField == null || !whitelist.contains(field)) return null;
        return (prefix != null ? prefix + "." : "") + dbField + " " + dir;
    }

    // ========== 审计日志（设计文档 2.7：谁在何时对何资源做了何操作，敏感字段不写入） ==========

    private record Actor(long userId, String email) {}

    private Actor getCurrentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return null;
        String principalName;
        if (auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails ud) {
            principalName = ud.getUsername();
        } else {
            principalName = auth.getPrincipal().toString();
        }
        try {
            long userId = Long.parseLong(principalName);
            UserEntity user = userMapper.findById(userId);
            if (user != null) return new Actor(userId, user.getEmail());
        } catch (NumberFormatException ignored) {
            // 非数字 principal（如匿名）忽略
        }
        return null;
    }

    private void writeAudit(String action, String resourceType, String resourceId, String oldValue, String newValue) {
        Actor actor = getCurrentActor();
        String jsonOld = truncate(oldValue, AUDIT_VALUE_MAX_LENGTH);
        String jsonNew = truncate(newValue, AUDIT_VALUE_MAX_LENGTH);
        AuditLogEntity log = new AuditLogEntity();
        log.setActorId(actor != null ? actor.userId() : null);
        log.setActorEmail(actor != null ? actor.email() : null);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setOldValue(jsonOld);
        log.setNewValue(jsonNew);
        log.setIpAddress(null);
        log.setUserAgent(null);
        log.setCreatedAt(LocalDateTime.now());
        auditLogMapper.insert(log);
    }

    private static String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }

    /** 用户快照（不含密码），用于审计 old_value/new_value */
    private String userSnapshot(UserEntity e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("name", e.getName());
        m.put("email", e.getEmail());
        m.put("phone", e.getPhone());
        m.put("emailVerified", e.getEmailVerified());
        m.put("createdAt", e.getCreatedAt());
        m.put("updatedAt", e.getUpdatedAt());
        m.put("deletedAt", e.getDeletedAt());
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException ex) {
            return m.toString();
        }
    }

    /** 角色快照，用于审计 */
    private String roleSnapshot(RoleEntity e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("name", e.getName());
        m.put("code", e.getCode());
        m.put("description", e.getDescription());
        m.put("createdAt", e.getCreatedAt());
        m.put("updatedAt", e.getUpdatedAt());
        m.put("deletedAt", e.getDeletedAt());
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException ex) {
            return m.toString();
        }
    }
}
