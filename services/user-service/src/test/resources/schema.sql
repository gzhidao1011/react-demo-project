-- H2 测试用 schema（与 Flyway V1+V2 结构一致）
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
