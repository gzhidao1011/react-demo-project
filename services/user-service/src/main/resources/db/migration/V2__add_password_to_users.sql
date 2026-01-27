-- V2__add_password_to_users.sql
-- 添加密码字段到 users 表

-- 添加 password 字段（如果字段已存在，Flyway 会跳过此迁移）
-- 注意：Flyway 会跟踪已执行的迁移，所以重复执行是安全的
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '';

-- 为现有用户设置临时密码（BCrypt 哈希值，密码为 "temp123456"）
-- 注意：生产环境应强制用户重置密码
-- 使用临时 BCrypt 哈希值：$2a$12$...（对应密码 "temp123456"）
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZ5Z5Z5u' 
WHERE password = '' OR password IS NULL;
