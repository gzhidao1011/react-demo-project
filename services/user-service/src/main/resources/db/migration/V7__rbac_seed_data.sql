-- V7__rbac_seed_data.sql
-- 种子数据：内置权限与至少一个角色（如 ADMIN），并分配权限

INSERT INTO permissions (resource, action, description, created_at) VALUES
('user', 'read', '查看用户', NOW()),
('user', 'write', '创建/更新/删除用户', NOW()),
('role', 'read', '查看角色', NOW()),
('role', 'write', '创建/更新/删除角色与权限绑定', NOW()),
('permission', 'read', '查看权限', NOW()),
('audit', 'read', '查看审计日志', NOW())
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 插入 ADMIN 角色（若不存在）
INSERT INTO roles (name, code, description, created_at, updated_at, deleted_at)
SELECT '管理员', 'ADMIN', '系统管理员，拥有全部权限', NOW(), NOW(), NULL FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN' AND deleted_at IS NULL);

-- 为 ADMIN 分配全部权限
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW() FROM roles r CROSS JOIN permissions p
WHERE r.code = 'ADMIN' AND r.deleted_at IS NULL;

-- 插入 USER 角色（若不存在）
INSERT INTO roles (name, code, description, created_at, updated_at, deleted_at)
SELECT '普通用户', 'USER', '普通用户', NOW(), NOW(), NULL FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'USER' AND deleted_at IS NULL);

-- 为 USER 分配 user:read 权限
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW() FROM roles r CROSS JOIN permissions p
WHERE r.code = 'USER' AND r.deleted_at IS NULL AND p.resource = 'user' AND p.action = 'read';
