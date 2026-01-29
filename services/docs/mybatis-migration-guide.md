# JPA 迁移至 MyBatis 指南

本文档记录项目从 Spring Data JPA 迁移至 MyBatis 的变更说明。

## 迁移概述

- **迁移时间**：2025-01
- **影响服务**：user-service、order-service
- **迁移原因**：采用国内主流的 MyBatis 方案，便于 SQL 精细控制和团队协作

## 变更清单

### 1. 依赖变更

**移除**：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

**新增**：
```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

### 2. 配置变更

**移除**：
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

**新增**：
```yaml
mybatis:
  mapper-locations: classpath:mapper/**/*.xml
  type-aliases-package: com.example.*.entity
  configuration:
    map-underscore-to-camel-case: true
```

### 3. 代码结构变更

| JPA | MyBatis |
|-----|---------|
| `@Entity` + JPA 注解 | 纯 POJO（无注解） |
| `Repository extends JpaRepository` | `Mapper` 接口 + XML |
| `userRepository.save()` | `userMapper.insert()` / `userMapper.update()` |
| `userRepository.findById()` | `userMapper.findById()` |
| `userRepository.findByEmail()` | `userMapper.findByEmail()` |

### 4. 目录结构

```
src/main/
├── java/.../
│   ├── entity/     # 实体类（无 JPA 注解）
│   └── mapper/     # Mapper 接口（替代 repository）
└── resources/
    └── mapper/      # Mapper XML 文件
        └── UserMapper.xml
```

### 5. 时间戳处理

JPA 使用 `@PrePersist` / `@PreUpdate` 自动设置时间戳。MyBatis 需在业务层手动设置：

```java
var now = LocalDateTime.now();
entity.setCreatedAt(now);
entity.setUpdatedAt(now);
userMapper.insert(entity);
```

### 6. 测试配置

**JPA 测试**（Hibernate 自动建表）：
```properties
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.flyway.enabled=false
```

**MyBatis 测试**（schema.sql + H2）：
```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL
spring.flyway.enabled=false
spring.sql.init.mode=always
```

测试资源需提供 `schema.sql` 创建表结构。

## 相关文档

- [Java 微服务指南](./java-microservices-guide.md) - 数据库集成章节已更新为 MyBatis
- [JPA 替代方案分析](./jpa-alternatives-analysis.md) - 选型分析（若存在）
