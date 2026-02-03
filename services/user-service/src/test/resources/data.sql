-- 测试用 RBAC 种子数据（H2）
INSERT INTO permissions (id, resource, action, description, created_at)
SELECT 1, 'user', 'read', '查看用户', CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE id = 1);
INSERT INTO permissions (id, resource, action, description, created_at)
SELECT 2, 'user', 'write', '创建/更新/删除用户', CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE id = 2);
INSERT INTO permissions (id, resource, action, description, created_at)
SELECT 3, 'role', 'read', '查看角色', CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE id = 3);
INSERT INTO permissions (id, resource, action, description, created_at)
SELECT 4, 'role', 'write', '创建/更新/删除角色', CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE id = 4);
INSERT INTO permissions (id, resource, action, description, created_at)
SELECT 5, 'permission', 'read', '查看权限', CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE id = 5);
INSERT INTO roles (id, name, code, description, created_at, updated_at, deleted_at)
SELECT 1, '管理员', 'ADMIN', '系统管理员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 1);
INSERT INTO roles (id, name, code, description, created_at, updated_at, deleted_at)
SELECT 2, '普通用户', 'USER', '普通用户', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 2);
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, 1, CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = 1);
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, 2, CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = 2);
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, 3, CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = 3);
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, 4, CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = 4);
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, 5, CURRENT_TIMESTAMP FROM (SELECT 1) t WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = 5);
