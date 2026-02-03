-- V5__rbac_roles_permissions.sql
-- RBAC：角色、权限、用户-角色、角色-权限；用户表软删除字段
-- 与设计文档 2.1 一致：roles/permissions/user_roles/role_permissions，users.deleted_at

-- 用户表增加软删除字段（列表与唯一性校验默认排除 deleted_at IS NULL）
ALTER TABLE users
ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;

CREATE INDEX idx_users_deleted_at ON users (deleted_at);

-- 角色表：code 唯一，软删除
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uk_roles_code (code),
    INDEX idx_roles_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 权限表：(resource, action) 唯一，通常只读/预定义
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME,
    UNIQUE KEY uk_permissions_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户-角色多对多
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at DATETIME,
    PRIMARY KEY (user_id, role_id),
    INDEX idx_user_roles_role_id (role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 角色-权限多对多
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at DATETIME,
    PRIMARY KEY (role_id, permission_id),
    INDEX idx_role_permissions_permission_id (permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
